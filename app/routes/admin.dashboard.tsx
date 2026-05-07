import { count, eq } from "drizzle-orm";
import type { Route } from "./+types/admin.dashboard";
import { db } from "~/db";
import {
  bookingLinks,
  bookings,
  creatorIntegrations,
  offers,
} from "~/db/schema";
import { requireCreatorAdmin } from "~/lib/auth.server";

export function meta() {
  return [{ title: "Creator Admin — Hatch" }];
}

export async function loader(args: Route.LoaderArgs) {
  const { user, creator } = await requireCreatorAdmin(args);

  if (!creator) {
    return {
      user,
      creator: null,
      stats: null,
      integrations: [],
    };
  }

  const [
    [offerCount],
    [bookingLinkCount],
    [upcomingBookingCount],
    integrations,
  ] = await Promise.all([
    db.select({ count: count() }).from(offers).where(eq(offers.creatorId, creator.id)),
    db
      .select({ count: count() })
      .from(bookingLinks)
      .where(eq(bookingLinks.creatorId, creator.id)),
    db
      .select({ count: count() })
      .from(bookings)
      .where(eq(bookings.creatorId, creator.id)),
    db.query.creatorIntegrations.findMany({
      where: eq(creatorIntegrations.creatorId, creator.id),
    }),
  ]);

  return {
    user,
    creator,
    stats: {
      offers: offerCount.count,
      bookingLinks: bookingLinkCount.count,
      bookings: upcomingBookingCount.count,
    },
    integrations,
  };
}

export default function AdminDashboard({ loaderData }: Route.ComponentProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-500">
          Manage your booking setup, payments, and creator operations from one place.
        </p>
      </div>

      {!loaderData.creator ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
          You have creator-level access, but no creator profile yet. Open Payments to
          create one and connect your accounts.
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Offers" value={loaderData.stats?.offers ?? 0} />
            <StatCard label="Booking Links" value={loaderData.stats?.bookingLinks ?? 0} />
            <StatCard label="Bookings" value={loaderData.stats?.bookings ?? 0} />
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5">
            <h2 className="text-lg font-semibold text-gray-900">Connected Services</h2>
            <div className="mt-4 space-y-3">
              {loaderData.integrations.length === 0 ? (
                <p className="text-sm text-gray-400">No services connected yet.</p>
              ) : (
                loaderData.integrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{integration.type}</p>
                      <p className="text-sm text-gray-500">
                        Status: {integration.status}
                      </p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                      {integration.externalAccountId || "Configured in-app"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-6 py-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
