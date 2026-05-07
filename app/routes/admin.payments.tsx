import { Form } from "react-router";
import type { Route } from "./+types/admin.payments";
import { and, eq } from "drizzle-orm";
import { db } from "~/db";
import { creatorIntegrations, creators, offers } from "~/db/schema";
import { promoteUserToCreator, requireCreatorAdmin } from "~/lib/auth.server";
import {
  getCreatorGoogleCalendarIntegration,
  isGoogleCalendarConfigured,
} from "~/lib/google-calendar.server";
import {
  CREATOR_STRIPE_INTEGRATION_TYPE,
  connectCreatorStripeAccessToken,
  disconnectCreatorStripeAccessToken,
  listCreatorOffers,
} from "~/lib/stripe.server";

export function meta() {
  return [{ title: "Payments — Admin — Hatch" }];
}

export async function loader(args: Route.LoaderArgs) {
  const { user, creator } = await requireCreatorAdmin(args);
  const origin = new URL(args.request.url).origin;

  const integration = creator
    ? await db.query.creatorIntegrations.findFirst({
        where: and(
          eq(creatorIntegrations.creatorId, creator.id),
          eq(creatorIntegrations.type, CREATOR_STRIPE_INTEGRATION_TYPE)
        ),
      })
    : null;

  const creatorOffers = creator ? await listCreatorOffers(creator.id) : [];
  const googleIntegration = creator
    ? await getCreatorGoogleCalendarIntegration(creator.id)
    : null;

  return {
    admin: user,
    creator,
    integration,
    googleIntegration,
    offers: creatorOffers,
    googleConfigured: isGoogleCalendarConfigured(),
    webhookEndpointUrl: creator
      ? `${origin}/api/stripe/webhook?creatorId=${creator.id}`
      : null,
  };
}

export async function action(args: Route.ActionArgs) {
  const { user, creator: existingCreator } = await requireCreatorAdmin(args);
  const formData = await args.request.formData();
  const intent = String(formData.get("intent") || "");

  let creator = existingCreator;

  if (intent === "create-creator") {
    if (!creator) {
      const slug = user.email.split("@")[0];
      const displayName =
        [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
      if (!slug || !displayName) {
        return {
          ok: false,
          error:
            "Your profile is missing an email or name. Update it in Clerk, reload, and try again.",
        };
      }
      const [created] = await db
        .insert(creators)
        .values({ userId: user.id, slug, displayName })
        .returning();
      creator = created ?? null;
      await promoteUserToCreator(user.id);
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

  if (intent === "save-payment-provider") {
    const provider = String(formData.get("provider") || "stripe").trim();
    const accessToken = String(formData.get("accessToken") || "").trim();
    const webhookSecret = String(formData.get("webhookSecret") || "").trim();

    if (provider !== "stripe") {
      return { ok: false, error: "Only Stripe access tokens are supported right now." };
    }

    if (!accessToken) {
      return { ok: false, error: "Enter a Stripe secret key." };
    }

    if (!webhookSecret) {
      return { ok: false, error: "Enter the Stripe webhook signing secret." };
    }

    try {
      await connectCreatorStripeAccessToken({
        creatorId: creator.id,
        accessToken,
        webhookSecret,
      });
      return { ok: true, message: "Payment provider saved." };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to validate the access token.";
      return { ok: false, error: message };
    }
  }

  if (intent === "disconnect-payment-provider") {
    await disconnectCreatorStripeAccessToken(creator.id);
    return { ok: true, message: "Payment provider disconnected." };
  }

  return { ok: false, error: "Unknown action" };
}

function parseIntegrationMetadata(metadata: string) {
  try {
    return JSON.parse(metadata) as {
      provider?: string;
      accountId?: string | null;
      accountEmail?: string | null;
      accountCountry?: string | null;
      businessName?: string | null;
      tokenPreview?: string | null;
      webhookSecretPreview?: string | null;
    };
  } catch {
    return {};
  }
}

export default function AdminPayments({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const integrationMetadata = loaderData.integration
    ? parseIntegrationMetadata(loaderData.integration.metadata)
    : null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
      <p className="max-w-2xl text-sm text-gray-500">
        Creators can plug in their own payment credentials here instead of going
        through a managed connected-account onboarding flow.
      </p>

      {actionData?.error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {actionData.error}
        </div>
      )}
      {actionData?.ok && actionData.message && (
        <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
          {actionData.message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <p className="text-sm font-medium text-gray-900">Checkout Model</p>
          <p className="mt-2 text-sm text-gray-500">
            Hatch now creates checkout sessions with each creator&apos;s own
            provider credentials. No platform-level connected-account setup is
            required.
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
            <p className="text-sm font-medium text-gray-900">Payment Provider</p>
            <p className="mt-1 text-sm text-gray-500">
              {loaderData.integration?.accessToken
                ? `Stripe token saved for ${integrationMetadata?.businessName || integrationMetadata?.accountEmail || integrationMetadata?.accountId || "this creator"}.`
                : "No provider token saved yet."}
            </p>
          </div>
        </div>

        {loaderData.creator ? (
          <div className="mt-4 space-y-4">
            <Form method="post" className="space-y-4">
              <input type="hidden" name="intent" value="save-payment-provider" />
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm text-gray-600">
                  <span>Provider</span>
                  <select
                    name="provider"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                    defaultValue="stripe"
                  >
                    <option value="stripe">Stripe</option>
                  </select>
                </label>
                <label className="space-y-1 text-sm text-gray-600">
                  <span>Secret Key</span>
                  <input
                    type="password"
                    name="accessToken"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                    placeholder="sk_live_... or sk_test_..."
                    autoComplete="off"
                    required
                  />
                </label>
                <label className="space-y-1 text-sm text-gray-600 md:col-span-2">
                  <span>Webhook Signing Secret</span>
                  <input
                    type="password"
                    name="webhookSecret"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                    placeholder="whsec_..."
                    autoComplete="off"
                    required
                  />
                </label>
              </div>
              <p className="text-sm text-gray-500">
                Start with Stripe. Save both the account&apos;s secret key and the
                webhook signing secret so Hatch can create checkout sessions and
                confirm payments asynchronously.
              </p>
              <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
                {loaderData.integration?.accessToken ? "Update Token" : "Save Token"}
              </button>
            </Form>

            {loaderData.integration?.accessToken && (
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
                <p>
                  Saved token: {integrationMetadata?.tokenPreview || "Hidden"}
                </p>
                <p className="mt-1">
                  Webhook secret: {integrationMetadata?.webhookSecretPreview || "Hidden"}
                </p>
                {integrationMetadata?.accountId && (
                  <p className="mt-1">Stripe account: {integrationMetadata.accountId}</p>
                )}
                {integrationMetadata?.accountCountry && (
                  <p className="mt-1">Country: {integrationMetadata.accountCountry}</p>
                )}
                <Form method="post" className="mt-4">
                  <input type="hidden" name="intent" value="disconnect-payment-provider" />
                  <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">
                    Disconnect Provider
                  </button>
                </Form>
              </div>
            )}

            {loaderData.webhookEndpointUrl && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                <p className="font-medium">Stripe Webhook Setup</p>
                <ol className="mt-3 list-decimal space-y-2 pl-5">
                  <li>
                    In Stripe, open <span className="font-medium">Developers or Workbench → Webhooks</span> and create a new event destination.
                  </li>
                  <li>
                    Choose <span className="font-medium">Account</span> or <span className="font-medium">Your account</span>, not Connect / Connected accounts.
                  </li>
                  <li>
                    Use this endpoint URL:{" "}
                    <code className="rounded bg-white px-1 py-0.5">
                      {loaderData.webhookEndpointUrl}
                    </code>
                  </li>
                  <li>
                    Subscribe to exactly this event:{" "}
                    <code className="rounded bg-white px-1 py-0.5">
                      checkout.session.completed
                    </code>
                  </li>
                  <li>
                    After Stripe creates the endpoint, reveal the signing secret that starts with{" "}
                    <code className="rounded bg-white px-1 py-0.5">whsec_</code> and paste it into the field above.
                  </li>
                </ol>
                <p className="mt-3 text-xs text-blue-800">
                  This follows Stripe&apos;s account-webhook flow rather than a Connect webhook. Query-string routing in the URL is an implementation detail on our side so each creator can keep a separate signing secret.
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">
            Create the creator profile first.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900">Google Calendar</p>
            <p className="mt-1 text-sm text-gray-500">
              {loaderData.googleIntegration?.status === "active"
                ? "Connected and ready for busy checks and event creation."
                : loaderData.googleConfigured
                  ? "Not connected yet."
                  : "Missing Google OAuth environment variables."}
            </p>
          </div>
          {loaderData.creator && loaderData.googleConfigured && (
            <a
              href="/api/google-calendar/connect"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
            >
              {loaderData.googleIntegration ? "Reconnect Calendar" : "Connect Calendar"}
            </a>
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
