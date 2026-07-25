import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  // Instantiate inside the handler to prevent build-time evaluation errors on Vercel
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

  try {
    const { application_id, amount } = await request.json();

    if (!application_id) return NextResponse.json({ error: "Missing application_id" }, { status: 400 });

    // 1. Fetch application to get brand_id and influencer_id
    const { data: app } = await supabaseAdmin
      .from("campaign_applications")
      .select("influencer_id, campaigns(brand_id)")
      .eq("id", application_id)
      .single();

    if (!app || !app.campaigns) throw new Error("App not found");

    // 2. Create the collaboration in 'in_progress' state (Funds are locked)
    const { error: collabError } = await supabaseAdmin.from("collaborations").insert({
      application_id,
      brand_id: (app.campaigns as any).brand_id,
      influencer_id: app.influencer_id,
      status: "in_progress",
      agreed_amount: amount,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // +14 days default
    });

    if (collabError) throw collabError;

    // 3. Mark application as accepted (if not already done)
    await supabaseAdmin.from("campaign_applications").update({ status: "accepted" }).eq("id", application_id);

    return NextResponse.json({ success: true, message: "Escrow secured. Collaboration started." });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
