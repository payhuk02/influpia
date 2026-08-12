import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
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

    // Fetch API key to authenticate requests from platform_settings
    const { data: settings } = await supabaseAdmin.from('platform_settings').select('moneyfusion_api_key').single();

    // Verify the payment directly with MoneyFusion API
    const mfResponse = await fetch(`https://www.pay.moneyfusion.net/paiementNotif/${tokenPay}`, {
      headers: {
        'Authorization': `Bearer ${settings?.moneyfusion_api_key}`
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
        .select("status")
        .eq("id", collaborationId)
        .single();
        
      if (!existingCollab) throw new Error("Collaboration not found");
      
      if (existingCollab.status === "escrow_secured") {
        return NextResponse.json({ success: true, message: "Déjà traité." });
      }

      await supabaseAdmin
        .from("collaborations")
        .update({ status: "escrow_secured" })
        .eq("id", collaborationId);

      return NextResponse.json({ success: true, message: "Service Escrow secured via Moneyfusion." });
    }

    // SCENARIO 2: Classic B2B (Campaign Application)
    if (applicationId) {
      const { data: app } = await supabaseAdmin
        .from("campaign_applications")
        .select("influencer_id, campaigns(brand_id)")
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

      // Create the collaboration in 'escrow_secured' state
      const { error: collabError } = await supabaseAdmin.from("collaborations").insert({
        application_id: applicationId,
        brand_id: (app.campaigns as any).brand_id,
        influencer_id: app.influencer_id,
        status: "escrow_secured", // Funds are locked in Escrow
        agreed_amount: amount * 100, // stored in cents
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      });

      if (collabError) throw collabError;

      await supabaseAdmin.from("campaign_applications").update({ status: "accepted" }).eq("id", applicationId);

      return NextResponse.json({ success: true, message: "Campaign Escrow secured via Moneyfusion." });
    }

    return NextResponse.json({ success: false, error: "Invalid state" }, { status: 400 });

  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
