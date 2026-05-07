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

export const CREATOR_STRIPE_INTEGRATION_TYPE = "stripe_connect";

let stripeClient: Stripe | null = null;

export function getStripeConfig() {
  return {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
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

export function createStripeClient(secretKey: string) {
  return new Stripe(secretKey);
}

export async function getCreatorStripeIntegration(creatorId: number) {
  return db.query.creatorIntegrations.findFirst({
    where: and(
      eq(creatorIntegrations.creatorId, creatorId),
      eq(creatorIntegrations.type, CREATOR_STRIPE_INTEGRATION_TYPE)
    ),
  });
}

function maskStripeAccessToken(accessToken: string) {
  if (accessToken.length <= 8) {
    return "Saved";
  }

  return `${accessToken.slice(0, 4)}...${accessToken.slice(-4)}`;
}

export async function connectCreatorStripeAccessToken(args: {
  creatorId: number;
  accessToken: string;
  webhookSecret: string;
}) {
  const stripe = createStripeClient(args.accessToken);
  const account = await stripe.accounts.retrieve(null);

  await db
    .insert(creatorIntegrations)
    .values({
      creatorId: args.creatorId,
      type: CREATOR_STRIPE_INTEGRATION_TYPE,
      status: "active",
      externalAccountId: account.id,
      accessToken: args.accessToken,
      refreshToken: args.webhookSecret,
      metadata: JSON.stringify({
        provider: "stripe",
        accountId: account.id,
        accountEmail: account.email,
        accountCountry: account.country,
        businessName: account.business_profile?.name || null,
        tokenPreview: maskStripeAccessToken(args.accessToken),
        webhookSecretPreview: maskStripeAccessToken(args.webhookSecret),
      }),
      connectedAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        creatorIntegrations.creatorId,
        creatorIntegrations.type,
      ],
      set: {
        status: "active",
        externalAccountId: account.id,
        accessToken: args.accessToken,
        refreshToken: args.webhookSecret,
        metadata: JSON.stringify({
          provider: "stripe",
          accountId: account.id,
          accountEmail: account.email,
          accountCountry: account.country,
          businessName: account.business_profile?.name || null,
          tokenPreview: maskStripeAccessToken(args.accessToken),
          webhookSecretPreview: maskStripeAccessToken(args.webhookSecret),
        }),
        connectedAt: new Date(),
        expiresAt: null,
        updatedAt: new Date(),
      },
    });

  return account;
}

export async function disconnectCreatorStripeAccessToken(creatorId: number) {
  const integration = await getCreatorStripeIntegration(creatorId);
  if (!integration) {
    return;
  }

  await db
    .update(creatorIntegrations)
    .set({
      status: "disconnected",
      externalAccountId: null,
      accessToken: null,
      refreshToken: null,
      metadata: "{}",
      expiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(creatorIntegrations.id, integration.id));
}

async function getCreatorStripeClient(creatorId: number) {
  const integration = await getCreatorStripeIntegration(creatorId);
  if (!integration?.accessToken) {
    throw new Error("Creator has not configured a Stripe access token.");
  }

  return {
    integration,
    stripe: createStripeClient(integration.accessToken),
  };
}

export async function getCreatorStripeWebhookSecret(creatorId: number) {
  const integration = await getCreatorStripeIntegration(creatorId);
  return integration?.refreshToken || null;
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

  const [item] = await db.query.purchaseItems.findMany({
    where: eq(purchaseItems.purchaseId, purchase.id),
    limit: 1,
  });
  if (!item) {
    throw new Error("Purchase is missing items.");
  }

  const { stripe } = await getCreatorStripeClient(creator.id);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url:
      `${args.origin}/account/calls?checkout=success&purchaseId=${purchase.id}` +
      "&session_id={CHECKOUT_SESSION_ID}",
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

export async function confirmCheckoutSessionForPurchase(args: {
  purchaseId: number;
  sessionId: string;
}) {
  const purchase = await db.query.purchases.findFirst({
    where: eq(purchases.id, args.purchaseId),
  });
  if (!purchase) {
    throw new Error("Purchase not found.");
  }

  const { stripe } = await getCreatorStripeClient(purchase.creatorId);
  const session = await stripe.checkout.sessions.retrieve(args.sessionId);

  if (String(session.metadata?.purchaseId || "") !== String(purchase.id)) {
    throw new Error("Checkout session does not match this purchase.");
  }

  if (session.payment_status === "paid") {
    await fulfillCheckoutSession(session);
    return { fulfilled: true, session };
  }

  return { fulfilled: false, session };
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
