import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

const mapStripeStatusToEnum = (
  status: string,
): "ACTIVE" | "CANCELED" | "INCOMPLETE" => {
  if (status === "active") return "ACTIVE";
  if (status === "canceled") return "CANCELED";
  return "INCOMPLETE";
};

const mapPlanToEnum = (
  plan: string | undefined | null,
): "MONTHLY" | "YEARLY" => {
  if (plan?.toLowerCase() === "yearly") return "YEARLY";
  return "MONTHLY";
};

const parseEndDate = (
  currentPeriodEnd: number | string | null | undefined,
): Date | null => {
  if (currentPeriodEnd === null || currentPeriodEnd === undefined) {
    return null;
  }

  const timestamp =
    typeof currentPeriodEnd === "string"
      ? Number(currentPeriodEnd)
      : currentPeriodEnd;

  if (typeof timestamp === "number" && isFinite(timestamp)) {
    const date = new Date(timestamp * 1000);
    return date;
  } else {
    console.error(
      `parseEndDate: Invalid or non-numeric current_period_end from Stripe: ${currentPeriodEnd} (type: ${typeof currentPeriodEnd}). Setting endDate to null.`,
    );
    return null;
  }
};

export async function POST(req: Request) {
  try {
    const text = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      console.error("Missing Stripe signature");
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 },
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        text,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err: any) {
      console.error(`⚠️ Webhook signature verification failed:`, err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 },
      );
    }

    console.log(`✅ Success: Verified webhook event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`Processing checkout session: ${session.id}`);

        if (!session.subscription) {
          console.log(
            "No subscription ID found in this checkout session. This might be a one-time payment.",
          );
          return NextResponse.json({
            received: true,
            message: "Checkout session did not create a subscription.",
          });
        }

        const stripeApiResponse = await stripe.subscriptions.retrieve(
          session.subscription as string,
        );

        const actualRetrievedSubscription = ((stripeApiResponse as any).data ||
          stripeApiResponse) as Stripe.Subscription;

        if (
          !actualRetrievedSubscription ||
          typeof actualRetrievedSubscription.object !== "string" ||
          actualRetrievedSubscription.object !== "subscription"
        ) {
          console.error(
            "Failed to correctly extract Stripe.Subscription object from API response.",
            actualRetrievedSubscription,
          );
          if (
            (stripeApiResponse as any).data === undefined &&
            (stripeApiResponse as any).object === "subscription"
          ) {
            console.log(
              "Corrected: stripeApiResponse was the subscription object directly.",
            );
          } else {
            console.error(
              "Retrieved object is not a Stripe subscription:",
              actualRetrievedSubscription,
            );
            return NextResponse.json(
              { error: "Invalid subscription data retrieved from Stripe" },
              { status: 500 },
            );
          }
        }

        const email = session.customer_details?.email || session.customer_email;
        if (!email) {
          console.error(
            "No email associated with session. Customer ID:",
            session.customer,
          );
          return NextResponse.json(
            { error: "No email found in session" },
            { status: 400 },
          );
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          console.error(`User not found with email: ${email}`);
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 },
          );
        }

        const startDateTimestamp = (actualRetrievedSubscription as any)
          .start_date;
        const currentPeriodEndTimestamp = (actualRetrievedSubscription as any)
          .current_period_end;

        const subscriptionData = {
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: actualRetrievedSubscription.id,
          plan: mapPlanToEnum(session.metadata?.plan),
          status: mapStripeStatusToEnum(actualRetrievedSubscription.status),
          startDate: startDateTimestamp
            ? new Date(startDateTimestamp * 1000)
            : new Date(),
          endDate: parseEndDate(currentPeriodEndTimestamp),
        };

        if (!startDateTimestamp) {
          console.warn(
            `Warning: start_date not found on retrieved subscription ${actualRetrievedSubscription.id}. Using current date as fallback.`,
          );
        }

        await prisma.subscription.upsert({
          where: { userId: user.id },
          update: subscriptionData,
          create: {
            userId: user.id,
            ...subscriptionData,
          },
        });

        console.log(
          `Subscription created/updated for user: ${user.id} via checkout.session.completed`,
        );
        break;
      }

      case "customer.subscription.updated": {
        const updatedSubscription = event.data.object as Stripe.Subscription;
        console.log(
          `Processing subscription update: ${updatedSubscription.id}`,
        );

        const existingSubscription = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: updatedSubscription.id },
        });

        if (!existingSubscription) {
          console.error(
            `Subscription not found in DB for Stripe subscription ID: ${updatedSubscription.id}.`,
          );
          return NextResponse.json(
            { error: "Subscription not found in database for update" },
            { status: 404 },
          );
        }

        let planFromStripe: string | undefined | null = undefined;
        if (
          updatedSubscription.items &&
          updatedSubscription.items.data &&
          updatedSubscription.items.data.length > 0
        ) {
          planFromStripe =
            updatedSubscription.items.data[0].price?.lookup_key ||
            updatedSubscription.items.data[0].plan?.id;
        }
        if (!planFromStripe) {
          planFromStripe = (updatedSubscription as any).metadata?.plan;
        }

        const startDateTimestamp = (updatedSubscription as any).start_date;
        const currentPeriodEndTimestamp = (updatedSubscription as any)
          .current_period_end;

        const updateData: any = {
          plan: mapPlanToEnum(planFromStripe),
          status: mapStripeStatusToEnum(updatedSubscription.status),
          endDate: parseEndDate(currentPeriodEndTimestamp),
        };

        if (startDateTimestamp) {
          updateData.startDate = new Date(startDateTimestamp * 1000);
        } else {
          console.warn(
            `Warning: start_date not found on updated subscription ${updatedSubscription.id}. Not updating startDate.`,
          );
        }

        await prisma.subscription.update({
          where: { id: existingSubscription.id },
          data: updateData,
        });

        console.log(
          `Subscription updated in DB: ${existingSubscription.id} (Stripe ID: ${updatedSubscription.id})`,
        );
        break;
      }

      case "customer.subscription.deleted": {
        const deletedSubscription = event.data.object as Stripe.Subscription;
        console.log(
          `Processing subscription deletion: ${deletedSubscription.id}`,
        );

        const existingSubscription = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: deletedSubscription.id },
        });

        if (!existingSubscription) {
          console.error(
            `Subscription not found in DB for deletion, Stripe subscription ID: ${deletedSubscription.id}`,
          );
          return NextResponse.json(
            { error: "Subscription not found for deletion" },
            { status: 404 },
          );
        }

        const endedAtTimestamp = (deletedSubscription as any).ended_at;
        const currentPeriodEndTimestamp = (deletedSubscription as any)
          .current_period_end;

        await prisma.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            status: "CANCELED",
            endDate: endedAtTimestamp
              ? new Date(endedAtTimestamp * 1000)
              : parseEndDate(currentPeriodEndTimestamp),
          },
        });

        console.log(
          `Subscription status set to CANCELED in DB: ${existingSubscription.id} (Stripe ID: ${deletedSubscription.id})`,
        );
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true, eventType: event.type });
  } catch (error: any) {
    console.error("Webhook error:", error);
    if (error.name === "PrismaClientKnownRequestError") {
      console.error("Prisma Error Code:", error.code);
      console.error("Prisma Error Meta:", error.meta);
    }
    return NextResponse.json(
      { error: "Webhook handler failed", message: error.message },
      { status: 500 },
    );
  }
}
