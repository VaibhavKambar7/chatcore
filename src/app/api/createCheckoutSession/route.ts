import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan } = await req.json();
  const email = session.user?.email;

  const stripeSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price:
          plan === "monthly"
            ? process.env.STRIPE_MONTHLY_PRICE_ID
            : process.env.STRIPE_YEARLY_PRICE_ID,
        quantity: 1,
      },
    ],
    customer_email: email!,
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/billing`,
    metadata: { plan },
  });

  console.log(stripeSession);

  return NextResponse.json({ url: stripeSession.url });
}
