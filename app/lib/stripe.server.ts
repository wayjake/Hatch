import Stripe from "stripe";
import { and, desc, eq } from "drizzle-orm";
import { db } from "~/db";
import {
  bookingLinks,
  offers,
  creatorIntegrations,
  creators,
  purchaseItems,
  purchases,
  callCreditTransactions,
} from "~/db/schema";

export const STRIPE_COMMISSION_BPS_DEFAULT = 1500;

let stripeClient: Stripe | null = null;

export function getStripeConfig() {
  return {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    defaultCommissionBps: Number(
      process.env.STRIPE_COMMISSION_BPS || STRIPE_COMMISSION_BPS_DEFAULT
    ),
  };
}

export function getStripe() {
  const { secretKey } = getStripeConfig();
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}

export function calculateApplicationFee(amountCents: number, commissionBps: number) {
  return Math.round((amountCents * commissionBps) / 10000);
}

export async function getCreatorStripeIntegration(creatorId: number) {
  return db.query.creatorIntegrations.findFirst({
    where: and(
      eq(creatorIntegrations.creatorId, creatorId),
      eq(creatorIntegrations.type, "stripe_connect")
    ),
  });
}

export async function createPendingPurchaseForOffer(args: {
  userId: string;
  creatorId: number;
  offerId: number;
  couponCode?: string | null;
}) {
  const offer = await db.query.offers.findFirst({
    where: eq(offers.id, args.offerId),
  });
  if (!offer || offer.creatorId !== args.creatorId || !offer.isActive) {
    throw new Error("Offer not available.");
  }

  const [purchase] = await db
    .insert(purchases)
    .values({
      userId: args.userId,
      creatorId: args.creatorId,
      status: "pending",
      currency: offer.currency,
      subtotalCents: offer.priceCents,
      discountCents: 0,
      totalCents: offer.priceCents,
      couponCode: args.couponCode || null,
      metadata: JSON.stringify({ offerId: offer.id }),
    })
    .returning();

  if (!purchase) {
    throw new Error("Failed to create purchase.");
  }

  await db.insert(purchaseItems).values({
    purchaseId: purchase.id,
    offerId: offer.id,
    titleSnapshot: offer.title,
    quantity: 1,
    unitAmountCents: offer.priceCents,
    totalAmountCents: offer.priceCents,
    sessionCreditsGranted: offer.sessionCreditCount,
  });

  return { purchase, offer };
}

export async function createCheckoutSessionForPurchase(args: {
  purchaseId: number;
  bookingLinkId?: number | null;
  origin: string;
}) {
  const purchase = await db.query.purchases.findFirst({
    where: eq(purchases.id, args.purchaseId),
  });
  if (!purchase) {
    throw new Error("Purchase not found.");
  }

  const creator = await db.query.creators.findFirst({
    where: eq(creators.id, purchase.creatorId),
  });
  if (!creator) {
    throw new Error("Creator not found.");
  }

  const integration = await getCreatorStripeIntegration(creator.id);
  if (!integration?.externalAccountId) {
    throw new Error("Creator is not connected to Stripe.");
  }

  const [item] = await db.query.purchaseItems.findMany({
    where: eq(purchaseItems.purchaseId, purchase.id),
    limit: 1,
  });
  if (!item) {
    throw new Error("Purchase is missing items.");
  }

  const stripe = getStripe();
  const feeAmount = calculateApplicationFee(
    purchase.totalCents,
    getStripeConfig().defaultCommissionBps
  );

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${args.origin}/account/calls?checkout=success`,
    cancel_url: `${args.origin}/account/calls?checkout=canceled`,
    customer_email: undefined,
    allow_promotion_codes: true,
    line_items: [
      {
        quantity: item.quantity,
        price_data: {
          currency: purchase.currency,
          unit_amount: item.unitAmountCents,
          product_data: {
            name: item.titleSnapshot,
          },
        },
      },
    ],
    payment_intent_data: {
      application_fee_amount: feeAmount,
      transfer_data: {
        destination: integration.externalAccountId,
      },
      metadata: {
        purchaseId: String(purchase.id),
        creatorId: String(creator.id),
      },
    },
    metadata: {
      purchaseId: String(purchase.id),
      creatorId: String(creator.id),
      bookingLinkId: args.bookingLinkId ? String(args.bookingLinkId) : "",
    },
  });

  await db
    .update(purchases)
    .set({
      stripeCheckoutSessionId: session.id,
      totalCents: session.amount_total ?? purchase.totalCents,
      updatedAt: new Date(),
    })
    .where(eq(purchases.id, purchase.id));

  return session;
}

export async function fulfillCheckoutSession(session: Stripe.Checkout.Session) {
  const purchaseId = Number(session.metadata?.purchaseId || 0);
  if (!purchaseId) return;

  const purchase = await db.query.purchases.findFirst({
    where: eq(purchases.id, purchaseId),
  });
  if (!purchase || purchase.status === "paid") {
    return;
  }

  const items = await db.query.purchaseItems.findMany({
    where: eq(purchaseItems.purchaseId, purchase.id),
  });

  await db.transaction(async (tx) => {
    await tx
      .update(purchases)
      .set({
        status: "paid",
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
        totalCents: session.amount_total ?? purchase.totalCents,
        discountCents:
          session.total_details?.amount_discount ?? purchase.discountCents,
        purchasedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(purchases.id, purchase.id));

    const existing = await tx.query.callCreditTransactions.findMany({
      where: eq(callCreditTransactions.purchaseId, purchase.id),
    });
    if (existing.length > 0) {
      return;
    }

    const creditRows = items
      .filter((item) => item.sessionCreditsGranted > 0)
      .map((item) => ({
        userId: purchase.userId,
        creatorId: purchase.creatorId,
        purchaseId: purchase.id,
        type: "grant" as const,
        quantity: item.sessionCreditsGranted,
        note: `Granted from purchase #${purchase.id}`,
      }));

    if (creditRows.length > 0) {
      await tx.insert(callCreditTransactions).values(creditRows);
    }
  });
}

export async function listCreatorOffers(creatorId: number) {
  return db.query.offers.findMany({
    where: eq(offers.creatorId, creatorId),
    orderBy: [desc(offers.createdAt)],
  });
}

export async function getBookingLinkWithOffers(slug: string) {
  const bookingLink = await db.query.bookingLinks.findFirst({
    where: eq(bookingLinks.slug, slug),
  });
  if (!bookingLink) return null;

  const linkedOffers = await db.query.offers.findMany({
    where: eq(offers.creatorId, bookingLink.creatorId),
    orderBy: [desc(offers.createdAt)],
  });

  return { bookingLink, offers: linkedOffers };
}
