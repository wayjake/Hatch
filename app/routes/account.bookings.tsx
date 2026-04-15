import { Form, redirect } from "react-router";
import type { Route } from "./+types/account.bookings";
import { getAuthUserId, getOrCreateUser } from "~/lib/auth.server";
import {
  cancelConfirmedBooking,
  getUpcomingBookingsForUser,
} from "~/lib/booking.server";
import { deleteGoogleCalendarEvent } from "~/lib/google-calendar.server";
import { sendBookingCancellationTelegramMessage } from "~/lib/telegram.server";

export function meta() {
  return [{ title: "My Bookings — Hatch" }];
}

export async function loader(args: Route.LoaderArgs) {
  const userId = await getAuthUserId(args);
  if (!userId) throw redirect("/");

  await getOrCreateUser(args);

  return {
    bookings: await getUpcomingBookingsForUser(userId),
  };
}

export async function action(args: Route.ActionArgs) {
  const userId = await getAuthUserId(args);
  if (!userId) {
    throw redirect("/");
  }

  const formData = await args.request.formData();
  const intent = String(formData.get("intent") || "");
  const bookingId = Number(formData.get("bookingId") || 0);

  if (intent !== "cancel-booking" || !bookingId) {
    return { ok: false, error: "Invalid booking action." };
  }

  try {
    const result = await cancelConfirmedBooking({
      bookingId,
      userId,
    });

    if (result.booking.googleCalendarEventId) {
      await deleteGoogleCalendarEvent({
        creatorId: result.booking.creatorId,
        eventId: result.booking.googleCalendarEventId,
      });
    }

    if (result.creator && result.bookingLink) {
      await sendBookingCancellationTelegramMessage({
        creatorName: result.creator.displayName,
        attendeeName: result.booking.attendeeName,
        attendeeEmail: result.booking.attendeeEmail,
        startsAt: new Date(result.booking.startsAt),
        timezone: result.booking.timezone,
        bookingLinkTitle: result.bookingLink.title,
      });
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to cancel booking.",
    };
  }
}

export default function AccountBookings({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <p className="mt-2 text-sm text-gray-500">
          This will show upcoming and past sessions, along with reschedule and
          cancellation controls.
        </p>
      </div>

      {actionData?.error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {actionData.error}
        </div>
      )}
      {actionData?.ok && (
        <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
          Booking canceled and credit restored.
        </div>
      )}

      {loaderData.bookings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
          No bookings yet.
        </div>
      ) : (
        <div className="rounded-xl border border-gray-100 bg-white">
          {loaderData.bookings.map((booking) => (
            <div
              key={booking.id}
              className="border-b border-gray-100 px-5 py-4 last:border-b-0"
            >
              <p className="font-medium text-gray-900">{booking.bookingLinkTitle}</p>
              <p className="mt-1 text-sm text-gray-500">{booking.startsAtLabel}</p>
              <div className="mt-3 flex gap-2 text-xs">
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
                  {booking.status}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 ${
                    booking.calendarConnected
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {booking.calendarConnected ? "Calendar Invite Sent" : "Calendar Invite Pending"}
                </span>
              </div>
              {booking.canCancel && (
                <div className="mt-4 flex gap-3">
                  {booking.canReschedule && (
                    <a
                      href={`/book/${booking.bookingLinkSlug}?rescheduleBookingId=${booking.id}`}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Reschedule
                    </a>
                  )}
                  <Form method="post">
                    <input type="hidden" name="intent" value="cancel-booking" />
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <button className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
                      Cancel Booking
                    </button>
                  </Form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
