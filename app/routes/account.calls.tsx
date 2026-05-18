import { useEffect } from "react";
import { Link, redirect, useFetcher } from "react-router";
import type { Route } from "./+types/account.calls";
import { db } from "~/db";
import {
  getActiveBookingLinksForCreator,
  getRemainingCallCredits,
} from "~/lib/booking.server";
import { getAuthUserId, getOrCreateUser } from "~/lib/auth.server";
import {
  confirmCheckoutSessionForPurchase,
  listCreatorOffers,
} from "~/lib/stripe.server";

export function meta() {
  return [{ title: "Call Credits — Hatch" }];
}

export async function loader(args: Route.LoaderArgs) {
  const userId = await getAuthUserId(args);
  if (!userId) throw redirect("/");

  await getOrCreateUser(args);
  const url = new URL(args.request.url);
  const creator = await db.query.creators.findFirst();
  const offers = creator ? await listCreatorOffers(creator.id) : [];
  const bookingLinks = creator
    ? await getActiveBookingLinksForCreator(creator.id)
    : [];
  const checkoutState = String(url.searchParams.get("checkout") || "");
  const purchaseId = Number(url.searchParams.get("purchaseId") || 0);
  const sessionId = String(url.searchParams.get("session_id") || "");

  let checkoutMessage: string | null = null;
  let checkoutMessageTone: "success" | "neutral" | "error" = "neutral";
  if (checkoutState === "success" && purchaseId && sessionId) {
    try {
      const result = await confirmCheckoutSessionForPurchase({
        purchaseId,
        sessionId,
      });
      checkoutMessage = result.fulfilled
        ? "Payment received. Credits were added to your account."
        : "Payment is still processing. Credits will appear after confirmation.";
      checkoutMessageTone = result.fulfilled ? "success" : "neutral";
    } catch (error) {
      checkoutMessage =
        error instanceof Error ? error.message : "Unable to verify the checkout session.";
      checkoutMessageTone = "error";
    }
  } else if (checkoutState === "canceled") {
    checkoutMessage = "Checkout was canceled.";
  }

  return {
    creator,
    offers,
    bookingLinks,
    checkoutMessage,
    checkoutMessageTone,
    remainingCredits:
      creator ? await getRemainingCallCredits(userId, creator.id) : 0,
  };
}

export default function AccountCalls({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher<{ ok: boolean; checkoutUrl?: string; error?: string }>();

  useEffect(() => {
    if (fetcher.data?.checkoutUrl) {
      window.location.assign(fetcher.data.checkoutUrl);
    }
  }, [fetcher.data]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Call Credits</h1>
        <p className="mt-2 text-sm text-gray-500">
          Purchase credits first. Once payment clears, credits are added to your
          account and you can use them later when you book a time.
        </p>
      </div>

      {loaderData.checkoutMessage && (
        <div
          className={`rounded-xl p-4 text-sm ${
            loaderData.checkoutMessageTone === "success"
              ? "bg-emerald-50 text-emerald-700"
              : loaderData.checkoutMessageTone === "error"
                ? "bg-red-50 text-red-700"
                : "bg-gray-100 text-gray-700"
          }`}
        >
          {loaderData.checkoutMessage}
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <p className="text-sm text-gray-500">Remaining Credits</p>
        <p className="mt-2 text-4xl font-bold text-gray-900">
          {loaderData.remainingCredits}
        </p>
        {!loaderData.creator && (
          <p className="mt-3 text-sm text-gray-400">
            No site owner profile has been configured yet.
          </p>
        )}
      </div>

      {loaderData.offers.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Buy More Credits</h2>
          <div className="mt-4 space-y-4">
            {loaderData.offers.map((offer) => (
              <fetcher.Form
                key={offer.id}
                method="post"
                action="/api/stripe/checkout"
                className="rounded-xl border border-gray-100 p-4"
              >
                <input type="hidden" name="offerId" value={offer.id} />
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">{offer.title}</p>
                    <p className="mt-1 text-sm text-gray-500">{offer.description}</p>
                    <p className="mt-2 text-xs text-gray-400">
                      {offer.sessionCreditCount} credits
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      ${(offer.priceCents / 100).toFixed(0)}
                    </p>
                    <button
                      type="submit"
                      className="mt-3 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
                    >
                      {fetcher.state === "submitting"
                        ? "Starting checkout..."
                        : "Buy Credits"}
                    </button>
                  </div>
                </div>
              </fetcher.Form>
            ))}
            {fetcher.data?.error && (
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                {fetcher.data.error}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Use Credits To Book</h2>
        {loaderData.remainingCredits > 0 ? (
          <div className="mt-4 space-y-3">
            {loaderData.bookingLinks.length === 0 ? (
              <p className="text-sm text-gray-400">No booking links are active yet.</p>
            ) : (
              loaderData.bookingLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-gray-900">{link.title}</p>
                    <p className="text-sm text-gray-500">{link.durationMinutes} minutes</p>
                  </div>
                  <Link
                    to={`/book/${link.slug}`}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
                  >
                    Book With Credit
                  </Link>
                </div>
              ))
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">
            You need at least one credit before you can schedule a call.
          </p>
        )}
      </div>
    </div>
  );
}
