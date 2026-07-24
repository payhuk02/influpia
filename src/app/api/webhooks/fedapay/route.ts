import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Webhook handler for FedaPay Events
export async function POST(request: Request) {
  try {
    // We use the service role key to bypass RLS for webhooks
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const body = await request.json();
    const eventType = body.name; // e.g., 'transaction.approved'
    const transaction = body.entity;

    if (eventType === 'transaction.approved') {
      const { applicationId, brandId, influencerId } = transaction.custom_metadata;

      // 1. Mark Application as 'accepted'
      await supabase
        .from('campaign_applications')
        .update({ status: 'accepted' })
        .eq('id', applicationId);

      // 2. Create Collaboration (Escrow created)
      await supabase
        .from('collaborations')
        .insert({
          application_id: applicationId,
          brand_id: brandId,
          influencer_id: influencerId,
          agreed_amount: transaction.amount, // stored in cents
          status: 'in_progress', // Funds are locked in Escrow
        });

      return NextResponse.json({ success: true, message: "Escrow secured" });
    }

    if (eventType === 'transaction.canceled') {
       return NextResponse.json({ success: true, message: "Transaction canceled ignored" });
    }

    return NextResponse.json({ success: true, message: "Event ignored" });
  } catch (error: any) {
    console.error("FedaPay Webhook Error:", error);
    return NextResponse.json({ success: false, error: "Webhook processing failed" }, { status: 500 });
  }
}
