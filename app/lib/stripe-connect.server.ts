import { and, eq } from "drizzle-orm";
import { db } from "~/db";
import { creatorIntegrations } from "~/db/schema";
import { getStripe } from "~/lib/stripe.server";

export type StripeConnectAccountType = "express";

export function getStripeConnectOnboardingConfig() {
  return {
    accountType: "express" as StripeConnectAccountType,
    refreshUrl: process.env.STRIPE_CONNECT_REFRESH_URL || "",
    returnUrl: process.env.STRIPE_CONNECT_RETURN_URL || "",
  };
}

export async function createExpressConnectedAccount(args: {
  creatorId: number;
  email: string;
  businessProfileUrl?: string;
}) {
  const stripe = getStripe();
  const account = await stripe.accounts.create({
    type: "express",
    country: "US",
    email: args.email,
    business_type: "individual",
    business_profile: args.businessProfileUrl
      ? { url: args.businessProfileUrl }
      : undefined,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      creatorId: String(args.creatorId),
    },
  });

  await db
    .insert(creatorIntegrations)
    .values({
      creatorId: args.creatorId,
      type: "stripe_connect",
      status: "pending",
      externalAccountId: account.id,
      metadata: JSON.stringify({ charges_enabled: account.charges_enabled }),
      connectedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        creatorIntegrations.creatorId,
        creatorIntegrations.type,
      ],
      set: {
        status: "pending",
        externalAccountId: account.id,
        metadata: JSON.stringify({ charges_enabled: account.charges_enabled }),
        updatedAt: new Date(),
      },
    });

  return account;
}

export async function createStripeOnboardingLink(accountId: string) {
  const stripe = getStripe();
  const config = getStripeConnectOnboardingConfig();
  if (!config.refreshUrl || !config.returnUrl) {
    throw new Error("Stripe Connect return/refresh URLs are not configured.");
  }

  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: config.refreshUrl,
    return_url: config.returnUrl,
    type: "account_onboarding",
  });
}

export async function refreshStripeConnectStatus(creatorId: number) {
  const integration = await db.query.creatorIntegrations.findFirst({
    where: and(
      eq(creatorIntegrations.creatorId, creatorId),
      eq(creatorIntegrations.type, "stripe_connect")
    ),
  });
  if (!integration?.externalAccountId) return null;

  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(integration.externalAccountId);

  await db
    .update(creatorIntegrations)
    .set({
      status: account.details_submitted ? "active" : "pending",
      metadata: JSON.stringify({
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
      }),
      updatedAt: new Date(),
    })
    .where(eq(creatorIntegrations.id, integration.id));

  return account;
}
