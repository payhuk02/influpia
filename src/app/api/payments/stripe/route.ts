import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";

// Assuming you have STRIPE_SECRET_KEY in your environment, otherwise mocking for MVP
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2026-06-24.dahlia',
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { campaignId } = await req.json();

    if (!campaignId) {
      return NextResponse.json({ error: "ID de campagne manquant" }, { status: 400 });
    }

    // MOCK MODE: If there's no real Stripe key, we simulate a successful boost directly.
    if (!process.env.STRIPE_SECRET_KEY) {
      const { error } = await supabase
        .from('campaigns')
        .update({ is_boosted: true })
        .eq('id', campaignId);
        
      if (error) throw error;
      
      return NextResponse.json({ url: "/brand?boosted=true" });
    }

    // REAL STRIPE CHECKOUT:
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Boost de Campagne (Mise en avant)",
              description: "Apparaissez en tête des résultats pour les créateurs.",
            },
            unit_amount: 2000, // 20.00 EUR
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/brand?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/brand?canceled=true`,
      metadata: {
        campaignId,
        userId: user.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Erreur Stripe:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
