import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { logAudit } from '@/lib/audit';

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limited = rateLimit(`webhook:moneyfusion:${ip}`, { limit: 60, windowMs: 60_000 });
  if (!limited.ok) {
    return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
  }
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const body = await request.json();
    
    if (body.event !== 'payin.session.completed') {
      return NextResponse.json({ success: true, message: "Événement ignoré" });
    }

    const tokenPay = body.tokenPay;
    if (!tokenPay) {
      return NextResponse.json({ error: "Missing tokenPay" }, { status: 400 });
    }

    // Idempotence stricte : on enregistre l'événement pour éviter les doublons
    const { error: idempotencyError } = await supabaseAdmin
      .from('webhook_events')
      .insert({
        provider: 'moneyfusion',
        external_id: tokenPay,
        payload: body
      });

    if (idempotencyError) {
      if (idempotencyError.code === '23505') {
        // Unique violation (provider + external_id)
        return NextResponse.json({ success: true, message: "Déjà traité (idempotence)" });
      }
      console.error("Erreur insertion webhook_events:", idempotencyError);
    }

    // API key is read from the server environment only (never from the database)
    const moneyfusionApiKey = process.env.MONEYFUSION_API_KEY;
    if (!moneyfusionApiKey) {
      console.error('MONEYFUSION_API_KEY is not configured');
      return NextResponse.json({ error: 'Payment provider not configured' }, { status: 500 });
    }

    // Verify the payment directly with MoneyFusion API
    const mfResponse = await fetch(`https://www.pay.moneyfusion.net/paiementNotif/${tokenPay}`, {
      headers: {
        'Authorization': `Bearer ${moneyfusionApiKey}`
      }
    });
    const mfData = await mfResponse.json();

    if (!mfData.statut || mfData.data.statut !== 'paid') {
      console.error("Payment verification failed:", mfData);
      return NextResponse.json({ error: "Payment not verified" }, { status: 400 });
    }

    const personalInfo = mfData.data.personal_Info?.[0] || {};
    const applicationId = personalInfo.applicationId || personalInfo.application_id;
    const collaborationId = personalInfo.collaborationId || personalInfo.collaboration_id;
    const amount = mfData.data.Montant;

    if (!applicationId && !collaborationId) {
      return NextResponse.json({ error: "Missing applicationId or collaborationId in personal_Info" }, { status: 400 });
    }

    // SCENARIO 1: Gig Economy (Direct Service Order)
    if (collaborationId) {
      const { data: existingCollab } = await supabaseAdmin
        .from("collaborations")
        .select("status, agreed_amount")
        .eq("id", collaborationId)
        .single();
        
      if (!existingCollab) throw new Error("Collaboration not found");
      
      if (existingCollab.status === "escrow_secured") {
        return NextResponse.json({ success: true, message: "Déjà traité." });
      }

      // Anti under-payment: the amount actually paid must cover the agreed amount
      const paidCents = Math.round(Number(amount) * 100);
      if (!Number.isFinite(paidCents) || paidCents < Number(existingCollab.agreed_amount)) {
        console.error("Amount mismatch", { paidCents, expected: existingCollab.agreed_amount });
        return NextResponse.json({ error: "Montant payé insuffisant" }, { status: 400 });
      }

      await supabaseAdmin
        .from("collaborations")
        .update({ status: "escrow_secured" })
        .eq("id", collaborationId);

      await logAudit({ action: 'payment.escrow_secured', targetType: 'collaboration', targetId: String(collaborationId), metadata: { provider: 'moneyfusion', amount }, ip });
      return NextResponse.json({ success: true, message: "Service Escrow secured via Moneyfusion." });
    }

    // SCENARIO 2: Classic B2B (Campaign Application)
    if (applicationId) {
      const { data: app } = await supabaseAdmin
        .from("campaign_applications")
        .select("influencer_id, campaigns(brand_id, budget)")
        .eq("id", applicationId)
        .single();

      if (!app || !app.campaigns) throw new Error("App not found");

      const { data: existingCollab } = await supabaseAdmin
        .from("collaborations")
        .select("id")
        .eq("application_id", applicationId)
        .maybeSingle();
        
      if (existingCollab) {
        return NextResponse.json({ success: true, message: "Déjà traité." });
      }

      // Anti under-payment: the paid amount must cover the campaign budget
      const campaign = app.campaigns as any;
      const paidCents = Math.round(Number(amount) * 100);
      const expectedCents = Number(campaign.budget);
      if (!Number.isFinite(paidCents) || (Number.isFinite(expectedCents) && paidCents < expectedCents)) {
        console.error("Amount mismatch", { paidCents, expectedCents });
        return NextResponse.json({ error: "Montant payé insuffisant" }, { status: 400 });
      }

      // Create the collaboration in 'escrow_secured' state
      const { error: collabError } = await supabaseAdmin.from("collaborations").insert({
        application_id: applicationId,
        brand_id: (app.campaigns as any).brand_id,
        influencer_id: app.influencer_id,
        status: "escrow_secured", // Funds are locked in Escrow
        agreed_amount: paidCents, // stored in cents
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      });

      if (collabError) throw collabError;

      await supabaseAdmin.from("campaign_applications").update({ status: "accepted" }).eq("id", applicationId);

      await logAudit({ action: 'payment.escrow_secured', targetType: 'application', targetId: String(applicationId), metadata: { provider: 'moneyfusion', amount }, ip });
      return NextResponse.json({ success: true, message: "Campaign Escrow secured via Moneyfusion." });
    }

    return NextResponse.json({ success: false, error: "Invalid state" }, { status: 400 });

  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
