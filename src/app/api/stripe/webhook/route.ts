import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const subscription = (await getStripe().subscriptions.retrieve(
      session.subscription as string
    )) as any;

    const companyId = session.metadata?.companyId;

    if (companyId) {
      await prisma.subscription.upsert({
        where: { companyId },
        update: {
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          status: subscription.status,
          plan: "PRO", // Simplified for now
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
        create: {
          companyId,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          status: subscription.status,
          plan: "PRO",
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as any;
    
    if (invoice.subscription) {
      const subscription = (await getStripe().subscriptions.retrieve(
        invoice.subscription as string
      )) as any;

      await prisma.subscription.update({
        where: {
          stripeSubscriptionId: subscription.id,
        },
        data: {
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });
    }
  }

  return new NextResponse(null, { status: 200 });
}
