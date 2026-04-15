import { useEffect } from "react";
import { useFetcher } from "react-router";
import type { Route } from "./+types/book.$slug";
import { getAuthUserId, getOrCreateUser } from "~/lib/auth.server";
import {
  getBookingLinkDetailBySlug,
  getRemainingCallCredits,
  getReschedulableBookingForUser,
  listAvailableSlotsForBookingLink,
} from "~/lib/booking.server";

export function meta() {
  return [{ title: "Book a Session — Hatch" }];
}

export async function loader(args: Route.LoaderArgs) {
  const { params } = args;
  const slug = params.slug;
  if (!slug) {
    throw new Response("Not found", { status: 404 });
  }

  const userId = await getAuthUserId(args);
  if (userId) {
    await getOrCreateUser(args);
  }
  const url = new URL(args.request.url);
  const rescheduleBookingId = Number(url.searchParams.get("rescheduleBookingId") || 0);

  const bookingLinkDetail = await getBookingLinkDetailBySlug(slug);
  if (!bookingLinkDetail) {
    throw new Response("Booking link not found", { status: 404 });
  }

  const rescheduleBooking =
    userId && rescheduleBookingId
      ? await getReschedulableBookingForUser({
          bookingId: rescheduleBookingId,
          userId,
        })
      : null;
  const remainingCredits = userId
    ? await getRemainingCallCredits(userId, bookingLinkDetail.bookingLink.creatorId)
    : 0;
  const slots =
    remainingCredits > 0 || Boolean(rescheduleBooking)
      ? await listAvailableSlotsForBookingLink(bookingLinkDetail.bookingLink.id, {
          excludeBookingId: rescheduleBooking?.booking.id,
        })
      : [];

  return {
    ...bookingLinkDetail,
    remainingCredits,
    slots,
    isAuthenticated: Boolean(userId),
    rescheduleBooking,
  };
}

export default function BookingPage({
  loaderData,
}: Route.ComponentProps) {
  const {
    bookingLink,
    offers,
    remainingCredits,
    slots,
    isAuthenticated,
    rescheduleBooking,
  } = loaderData;
  const purchaseFetcher = useFetcher<{ ok: boolean; checkoutUrl?: string }>();
  const bookingFetcher = useFetcher<{ ok: boolean; bookingId?: number; error?: string }>();
  const isRescheduling = Boolean(rescheduleBooking);

  useEffect(() => {
    if (purchaseFetcher.data?.checkoutUrl) {
      window.location.assign(purchaseFetcher.data.checkoutUrl);
    }
  }, [purchaseFetcher.data]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{bookingLink.title}</h1>
        <p className="mt-3 max-w-2xl text-sm text-gray-500">
          {isRescheduling
            ? "Choose a new time for your existing booking. Your credit balance will not change."
            : "Purchase happens before scheduling. Buying a package adds credits to your account, and those credits are what you spend later when you pick an actual time."}
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <div className="grid gap-3 text-sm text-gray-600">
          <p>Duration: {bookingLink.durationMinutes} minutes</p>
          <p>Minimum notice: {bookingLink.minimumNoticeHours} hours</p>
          <p>Booking horizon: {bookingLink.bookingHorizonDays} days</p>
          <p>Available credits: {remainingCredits}</p>
          {isRescheduling && (
            <p>Current booking: {rescheduleBooking?.booking.attendeeEmail}</p>
          )}
        </div>

        {!isAuthenticated ? (
          <p className="mt-8 text-sm text-gray-500">
            Sign in first so purchased credits can be attached to your account.
          </p>
        ) : isRescheduling || remainingCredits > 0 ? (
          <div className="mt-8 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {isRescheduling ? "Choose a New Time" : "Choose a Time"}
            </h2>
            {slots.length === 0 ? (
              <p className="text-sm text-gray-500">
                No open slots are currently available for this booking link.
              </p>
            ) : (
              slots.map((slot) => (
                <bookingFetcher.Form
                  key={slot.startsAt}
                  method="post"
                  action={isRescheduling ? "/api/bookings/reschedule" : "/api/bookings/create"}
                  className="flex items-center justify-between rounded-xl border border-gray-100 p-4"
                >
                  <input type="hidden" name="bookingLinkSlug" value={bookingLink.slug} />
                  <input type="hidden" name="startsAt" value={slot.startsAt} />
                  {isRescheduling && (
                    <input
                      type="hidden"
                      name="bookingId"
                      value={rescheduleBooking?.booking.id}
                    />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{slot.dateLabel}</p>
                    <p className="text-sm text-gray-500">{slot.label}</p>
                  </div>
                  <button
                    type="submit"
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
                  >
                    {bookingFetcher.state === "submitting"
                      ? isRescheduling
                        ? "Rescheduling..."
                        : "Booking..."
                      : isRescheduling
                        ? "Reschedule"
                        : "Use 1 Credit"}
                  </button>
                </bookingFetcher.Form>
              ))
            )}
            {bookingFetcher.data?.ok && (
              <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
                {isRescheduling
                  ? "Booking rescheduled successfully."
                  : "Booking confirmed. You can see it in your account dashboard."}
              </div>
            )}
            {bookingFetcher.data?.error && (
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                {bookingFetcher.data.error}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Buy Credits First</h2>
            {offers.map((offer) => (
              <purchaseFetcher.Form
                key={offer.id}
                method="post"
                action="/api/stripe/checkout"
                className="rounded-xl border border-gray-100 p-4"
              >
                <input type="hidden" name="offerId" value={offer.id} />
                <input type="hidden" name="bookingLinkSlug" value={bookingLink.slug} />
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-gray-900">{offer.title}</h2>
                    <p className="mt-1 text-sm text-gray-500">{offer.description}</p>
                    <p className="mt-2 text-xs text-gray-400">
                      {offer.sessionCreditCount > 0
                        ? `${offer.sessionCreditCount} call credits included`
                        : "No call credits included"}
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
                      {purchaseFetcher.state === "submitting"
                        ? "Starting checkout..."
                        : "Continue"}
                    </button>
                  </div>
                </div>
              </purchaseFetcher.Form>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
