import { Form } from "react-router";
import type { Route } from "./+types/admin.payments";
import { and, eq } from "drizzle-orm";
import { db } from "~/db";
import { creatorIntegrations, creators, offers } from "~/db/schema";
import { requireAdmin } from "~/lib/auth.server";
import {
  createExpressConnectedAccount,
  createStripeOnboardingLink,
  refreshStripeConnectStatus,
} from "~/lib/stripe-connect.server";
import { listCreatorOffers } from "~/lib/stripe.server";

export function meta() {
  return [{ title: "Payments — Admin — Hatch" }];
}

export async function loader(args: Route.LoaderArgs) {
  const admin = await requireAdmin(args);

  let creator = await db.query.creators.findFirst({
    where: eq(creators.userId, admin.id),
  });

  const integration = creator
    ? await db.query.creatorIntegrations.findFirst({
        where: and(
          eq(creatorIntegrations.creatorId, creator.id),
          eq(creatorIntegrations.type, "stripe_connect")
        ),
      })
    : null;

  const creatorOffers = creator ? await listCreatorOffers(creator.id) : [];

  return {
    admin,
    creator,
    integration,
    offers: creatorOffers,
    stripeConfigured: Boolean(
      process.env.STRIPE_SECRET_KEY &&
        process.env.STRIPE_PUBLISHABLE_KEY &&
        process.env.STRIPE_WEBHOOK_SECRET
    ),
  };
}

export async function action(args: Route.ActionArgs) {
  const admin = await requireAdmin(args);
  const formData = await args.request.formData();
  const intent = String(formData.get("intent") || "");

  let creator = await db.query.creators.findFirst({
    where: eq(creators.userId, admin.id),
  });

  if (intent === "create-creator") {
    if (!creator) {
      const [created] = await db
        .insert(creators)
        .values({
          userId: admin.id,
          slug: admin.email.split("@")[0],
          displayName: [admin.firstName, admin.lastName].filter(Boolean).join(" ") || admin.email,
        })
        .returning();
      creator = created ?? null;
    }
    return { ok: true };
  }

  if (!creator) {
    return { ok: false, error: "Create the creator profile first." };
  }

  if (intent === "seed-offers") {
    const existing = await db.query.offers.findMany({
      where: eq(offers.creatorId, creator.id),
    });
    if (existing.length === 0) {
      await db.insert(offers).values([
        {
          creatorId: creator.id,
          slug: "single-call",
          title: "Single Call",
          description: "One 1:1 coaching session.",
          type: "session_single",
          priceCents: 35000,
          sessionCreditCount: 1,
        },
        {
          creatorId: creator.id,
          slug: "four-call-pack",
          title: "4 Call Package",
          description: "Four 1:1 coaching sessions at the package rate.",
          type: "session_pack",
          priceCents: 120000,
          sessionCreditCount: 4,
        },
      ]);
    }
    return { ok: true };
  }

  if (intent === "connect-stripe") {
    const integration = await db.query.creatorIntegrations.findFirst({
      where: and(
        eq(creatorIntegrations.creatorId, creator.id),
        eq(creatorIntegrations.type, "stripe_connect")
      ),
    });
    const accountId =
      integration?.externalAccountId ||
      (
        await createExpressConnectedAccount({
          creatorId: creator.id,
          email: admin.email,
        })
      ).id;
    const link = await createStripeOnboardingLink(accountId);
    return Response.redirect(link.url, 302);
  }

  if (intent === "refresh-stripe-status") {
    await refreshStripeConnectStatus(creator.id);
    return { ok: true };
  }

  return { ok: false, error: "Unknown action" };
}

export default function AdminPayments({ loaderData }: Route.ComponentProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
      <p className="max-w-2xl text-sm text-gray-500">
        Stripe Connect onboarding, coaching offers, and commission-backed
        checkout flows are wired here first.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <p className="text-sm font-medium text-gray-900">Stripe Config</p>
          <p className="mt-2 text-sm text-gray-500">
            {loaderData.stripeConfigured
              ? "Configured"
              : "Missing one or more Stripe environment variables."}
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <p className="text-sm font-medium text-gray-900">Creator Profile</p>
          <p className="mt-2 text-sm text-gray-500">
            {loaderData.creator
              ? `Ready as ${loaderData.creator.displayName}`
              : "Not created yet"}
          </p>
          {!loaderData.creator && (
            <Form method="post" className="mt-4">
              <input type="hidden" name="intent" value="create-creator" />
              <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
                Create Creator
              </button>
            </Form>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900">Stripe Connect</p>
            <p className="mt-1 text-sm text-gray-500">
              {loaderData.integration?.externalAccountId
                ? `Connected account: ${loaderData.integration.externalAccountId}`
                : "No connected account yet"}
            </p>
          </div>
          {loaderData.creator && (
            <div className="flex gap-3">
              <Form method="post">
                <input type="hidden" name="intent" value="connect-stripe" />
                <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
                  {loaderData.integration ? "Re-open Onboarding" : "Connect Stripe"}
                </button>
              </Form>
              <Form method="post">
                <input type="hidden" name="intent" value="refresh-stripe-status" />
                <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">
                  Refresh Status
                </button>
              </Form>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900">Coaching Offers</p>
            <p className="mt-1 text-sm text-gray-500">
              Seed the default $350 single call and $1200 four-call package.
            </p>
          </div>
          {loaderData.creator && (
            <Form method="post">
              <input type="hidden" name="intent" value="seed-offers" />
              <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">
                Seed Offers
              </button>
            </Form>
          )}
        </div>

        <div className="mt-4 space-y-3">
          {loaderData.offers.length === 0 ? (
            <p className="text-sm text-gray-400">No offers yet.</p>
          ) : (
            loaderData.offers.map((offer) => (
              <div
                key={offer.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-gray-900">{offer.title}</p>
                  <p className="text-sm text-gray-500">{offer.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ${(offer.priceCents / 100).toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {offer.sessionCreditCount} credits
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
