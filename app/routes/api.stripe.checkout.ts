import type { Route } from "./+types/api.stripe.checkout";
import { getAuthUserId, getOrCreateUser } from "~/lib/auth.server";
import { db } from "~/db";
import { bookingLinks, creators, offers } from "~/db/schema";
import { eq } from "drizzle-orm";
import {
  createCheckoutSessionForPurchase,
  createPendingPurchaseForOffer,
} from "~/lib/stripe.server";

export async function action(args: Route.ActionArgs) {
  try {
    const userId = await getAuthUserId(args);
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    await getOrCreateUser(args);

    const formData = await args.request.formData();
    const offerId = Number(formData.get("offerId") || 0);
    const bookingLinkSlug = String(formData.get("bookingLinkSlug") || "");
    const couponCode = String(formData.get("couponCode") || "");

    if (!offerId) {
      return Response.json({ ok: false, error: "Missing offerId." }, { status: 400 });
    }

    const offer = await db.query.offers.findFirst({
      where: eq(offers.id, offerId),
    });
    if (!offer) {
      return Response.json({ ok: false, error: "Offer not found." }, { status: 404 });
    }

    const creator = await db.query.creators.findFirst({
      where: eq(creators.id, offer.creatorId),
    });
    if (!creator) {
      return Response.json({ ok: false, error: "Creator not found." }, { status: 404 });
    }

    const bookingLink = bookingLinkSlug
      ? await db.query.bookingLinks.findFirst({
          where: eq(bookingLinks.slug, bookingLinkSlug),
        })
      : null;

    const { purchase } = await createPendingPurchaseForOffer({
      userId,
      creatorId: creator.id,
      offerId,
      couponCode: couponCode || null,
    });

    const origin = new URL(args.request.url).origin;
    const session = await createCheckoutSessionForPurchase({
      purchaseId: purchase.id,
      bookingLinkId: bookingLink?.id ?? null,
      origin,
    });

    return Response.json({ ok: true, checkoutUrl: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start checkout.";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
