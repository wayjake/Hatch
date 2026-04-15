import { redirect } from "react-router";
import { getAuthUserId, getOrCreateUser } from "~/lib/auth.server";
import { getUpcomingBookingsForUser } from "~/lib/booking.server";

export function meta() {
  return [{ title: "My Bookings — Hatch" }];
}

export async function loader(args: any) {
  const userId = await getAuthUserId(args);
  if (!userId) throw redirect("/");

  await getOrCreateUser(args);

  return {
    bookings: await getUpcomingBookingsForUser(userId),
  };
}

export default function AccountBookings({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <p className="mt-2 text-sm text-gray-500">
          This will show upcoming and past sessions, along with reschedule and
          cancellation controls.
        </p>
      </div>

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
              <p className="font-medium text-gray-900">{booking.attendeeEmail}</p>
              <p className="text-sm text-gray-500">
                {new Date(booking.startsAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
