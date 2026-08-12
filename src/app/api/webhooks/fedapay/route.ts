import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { logAudit } from '@/lib/audit';

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limited = rateLimit(`webhook:fedapay:${ip}`, { limit: 60, windowMs: 60_000 });
  if (!limited.ok) {
    return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
  }
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-fedapay-signature');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Secret is read from the server environment only (never from the database)
    const secret = process.env.FEDAPAY_WEBHOOK_SECRET || process.env.FEDAPAY_SECRET_KEY;

    if (!signature || !secret) {
      return NextResponse.json({ success: false, error: "Signature manquante ou clé non configurée" }, { status: 400 });
    }

    // Verify HMAC SHA256 Signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ success: false, error: "Signature invalide" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const eventType = body.name; 
    const transaction = body.entity;

    // Idempotence stricte : on enregistre l'événement pour éviter les doublons
    if (transaction?.id) {
      const { error: idempotencyError } = await supabase
        .from('webhook_events')
        .insert({
          provider: 'fedapay',
          external_id: String(transaction.id),
          payload: body
        });
        
      if (idempotencyError) {
        if (idempotencyError.code === '23505') {
          // Unique violation (provider + external_id)
          return NextResponse.json({ success: true, message: "Déjà traité (idempotence)" });
        }
        console.error("Erreur insertion webhook_events:", idempotencyError);
      }
    }

    if (eventType === 'transaction.approved') {
      const { applicationId, collaborationId, brandId, influencerId } = transaction.custom_metadata || {};

      if (!applicationId && !collaborationId) {
        return NextResponse.json({ success: false, error: "Missing metadata" }, { status: 400 });
      }

      // SCENARIO 1: Gig Economy (Direct Service Order)
      if (collaborationId) {
        const { data: existingCollab } = await supabase
          .from("collaborations")
          .select("status, agreed_amount")
          .eq("id", collaborationId)
          .single();
          
        if (!existingCollab) throw new Error("Collaboration not found");
        
        if (existingCollab.status === "escrow_secured") {
          return NextResponse.json({ success: true, message: "Déjà traité." });
        }

        // Anti under-payment: FedaPay amounts are already in cents
        if (Number(transaction.amount) < Number(existingCollab.agreed_amount)) {
          console.error("Amount mismatch", { paid: transaction.amount, expected: existingCollab.agreed_amount });
          return NextResponse.json({ success: false, error: "Montant payé insuffisant" }, { status: 400 });
        }

        await supabase
          .from("collaborations")
          .update({ status: "escrow_secured" })
          .eq("id", collaborationId);

        await logAudit({ action: 'payment.escrow_secured', targetType: 'collaboration', targetId: String(collaborationId), metadata: { provider: 'fedapay', amount: transaction.amount }, ip });
        return NextResponse.json({ success: true, message: "Service Escrow secured via FedaPay." });
      }

      // SCENARIO 2: Classic B2B (Campaign Application)
      if (applicationId) {
        // Mark Application as 'accepted'
        await supabase
          .from('campaign_applications')
          .update({ status: 'accepted' })
          .eq('id', applicationId);

        // Verify if collaboration already exists
        const { data: existingCollab } = await supabase
          .from('collaborations')
          .select('id')
          .eq('application_id', applicationId)
          .maybeSingle();

        if (existingCollab) {
          return NextResponse.json({ success: true, message: "Déjà traité" });
        }

        // Create Collaboration with escrow_secured status
        await supabase
          .from('collaborations')
          .insert({
            application_id: applicationId,
            brand_id: brandId,
            influencer_id: influencerId,
            agreed_amount: transaction.amount, // stored in cents
            status: 'escrow_secured', // Funds are locked in Escrow
          });

        await logAudit({ action: 'payment.escrow_secured', targetType: 'application', targetId: String(applicationId), metadata: { provider: 'fedapay', amount: transaction.amount }, ip });
        return NextResponse.json({ success: true, message: "Campaign Escrow secured via FedaPay" });
      }
    }

    return NextResponse.json({ success: true, message: "Event ignored" });
  } catch (error: any) {
    console.error("FedaPay Webhook Error:", error);
    return NextResponse.json({ success: false, error: "Webhook processing failed" }, { status: 500 });
  }
}
