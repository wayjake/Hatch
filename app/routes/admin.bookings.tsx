import { redirect } from "react-router";
import { getAuthUserId, getOrCreateUser } from "~/lib/auth.server";
import { getCreatorByUserId, getUpcomingBookingsForCreator } from "~/lib/booking.server";

export function meta() {
  return [{ title: "Bookings — Admin — Hatch" }];
}

export async function loader(args: any) {
  const userId = await getAuthUserId(args);
  if (!userId) throw redirect("/");

  await getOrCreateUser(args);
  const creator = await getCreatorByUserId(userId);

  return {
    creator,
    bookings: creator ? await getUpcomingBookingsForCreator(creator.id) : [],
  };
}

export default function AdminBookings({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="mt-2 text-sm text-gray-500">
          Upcoming paid and confirmed calls will land here once the Stripe and
          Google Calendar flows are connected.
        </p>
      </div>

      {!loaderData.creator ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
          No creator profile exists for this admin yet.
        </div>
      ) : loaderData.bookings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
          No upcoming bookings yet.
        </div>
      ) : (
        <div className="rounded-xl border border-gray-100 bg-white">
          {loaderData.bookings.map((booking) => (
            <div
              key={booking.id}
              className="border-b border-gray-100 px-5 py-4 last:border-b-0"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900">{booking.bookingLinkTitle}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {booking.attendeeName || booking.attendeeEmail}
                  </p>
                  <p className="text-sm text-gray-500">{booking.attendeeEmail}</p>
                  <p className="mt-1 text-sm text-gray-500">{booking.startsAtLabel}</p>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                  {booking.status}
                </span>
              </div>
              <div className="mt-3 flex gap-2 text-xs">
                <span
                  className={`rounded-full px-2.5 py-1 ${
                    booking.calendarConnected
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {booking.calendarConnected ? "Calendar Synced" : "Calendar Pending"}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 ${
                    booking.telegramSent
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {booking.telegramSent ? "Telegram Sent" : "Telegram Pending"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
