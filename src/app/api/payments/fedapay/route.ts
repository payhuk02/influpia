import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { applicationId, amount } = await request.json();

    // Verification
    const { data: application } = await supabase
      .from('campaign_applications')
      .select('campaign_id, influencer_id')
      .eq('id', applicationId)
      .single();

    if (!application) throw new Error("Application not found");

    // FedaPay API integration
    const FEDAPAY_SECRET_KEY = process.env.FEDAPAY_SECRET_KEY || 'sk_sandbox_mock';
    
    // Create transaction via FedaPay SDK (Mocked for demonstration)
    /* 
    const transaction = await FedaPay.Transaction.create({
      description: `Escrow for campaign ${application.campaign_id}`,
      amount: amount, // amount is in cents!
      currency: { iso: 'XOF' },
      callback_url: `https://influpia.com/brand/payment-success?application_id=${applicationId}`,
      cancel_url: `https://influpia.com/brand/payment-cancel`,
      metadata: { applicationId, brandId: user.id, influencerId: application.influencer_id }
    });
    const token = await transaction.generateToken();
    */
    
    // Simulate FedaPay response
    const mockTransactionId = `txn_${Date.now()}`;
    const checkoutUrl = `https://sandbox.fedapay.com/pay/${mockTransactionId}`;

    return NextResponse.json({ 
      success: true, 
      checkoutUrl,
      transactionId: mockTransactionId
    });
  } catch (error: any) {
    console.error("FedaPay Checkout Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
