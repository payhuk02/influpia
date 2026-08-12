import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-fedapay-signature');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch the secret key dynamically from platform_settings
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('fedapay_secret_key')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .single();

    const secret = settings?.fedapay_secret_key || process.env.FEDAPAY_WEBHOOK_SECRET;

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

    if (eventType === 'transaction.approved') {
      const { applicationId, collaborationId, brandId, influencerId } = transaction.custom_metadata || {};

      if (!applicationId && !collaborationId) {
        return NextResponse.json({ success: false, error: "Missing metadata" }, { status: 400 });
      }

      // SCENARIO 1: Gig Economy (Direct Service Order)
      if (collaborationId) {
        const { data: existingCollab } = await supabase
          .from("collaborations")
          .select("status")
          .eq("id", collaborationId)
          .single();
          
        if (!existingCollab) throw new Error("Collaboration not found");
        
        if (existingCollab.status === "escrow_secured") {
          return NextResponse.json({ success: true, message: "Déjà traité." });
        }

        await supabase
          .from("collaborations")
          .update({ status: "escrow_secured" })
          .eq("id", collaborationId);

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

        return NextResponse.json({ success: true, message: "Campaign Escrow secured via FedaPay" });
      }
    }

    return NextResponse.json({ success: true, message: "Event ignored" });
  } catch (error: any) {
    console.error("FedaPay Webhook Error:", error);
    return NextResponse.json({ success: false, error: "Webhook processing failed" }, { status: 500 });
  }
}
