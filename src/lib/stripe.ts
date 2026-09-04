import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    stripeInstance = new Stripe(secretKey, {
      apiVersion: "2024-06-20" as any,
      typescript: true,
    });
  }

  return stripeInstance;
}
