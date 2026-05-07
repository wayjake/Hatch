import type { Route } from "./+types/api.stripe.webhook";
import Stripe from "stripe";
import {
  fulfillCheckoutSession,
  getCreatorStripeWebhookSecret,
} from "~/lib/stripe.server";

export async function action(args: Route.ActionArgs) {
  const url = new URL(args.request.url);
  const creatorId = Number(url.searchParams.get("creatorId") || 0);
  const signature = args.request.headers.get("stripe-signature");
  const webhookSecret = creatorId
    ? await getCreatorStripeWebhookSecret(creatorId)
    : null;

  if (!signature || !webhookSecret) {
    return new Response("Webhook not configured", { status: 400 });
  }

  const payload = await args.request.text();

  let event: Stripe.Event;
  try {
    event = Stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature";
    return new Response(message, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    await fulfillCheckoutSession(event.data.object as Stripe.Checkout.Session);
  }

  return Response.json({ received: true });
}
