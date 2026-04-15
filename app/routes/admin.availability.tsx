import { eq } from "drizzle-orm";
import type { Route } from "./+types/admin.availability";
import { db } from "~/db";
import { availabilityRules, bookingLinks, creators } from "~/db/schema";
import { requireAdmin } from "~/lib/auth.server";

export function meta() {
  return [{ title: "Availability — Admin — Hatch" }];
}

export async function loader(args: Route.LoaderArgs) {
  const admin = await requireAdmin(args);
  const creator = await db.query.creators.findFirst({
    where: eq(creators.userId, admin.id),
  });

  const links = creator
    ? await db.query.bookingLinks.findMany({
        where: eq(bookingLinks.creatorId, creator.id),
      })
    : [];

  const rules = links.length
    ? await db.query.availabilityRules.findMany({
        where: eq(availabilityRules.bookingLinkId, links[0].id),
      })
    : [];

  return { creator, links, rules };
}

export default function AdminAvailability({ loaderData }: Route.ComponentProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Availability</h1>
      <p className="max-w-2xl text-sm text-gray-500">
        Recurring windows and one-off overrides will be edited here before being
        intersected with Google Calendar busy events.
      </p>

      {loaderData.rules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
          No recurring availability rules yet. Seed a default booking link first.
        </div>
      ) : (
        <div className="space-y-3">
          {loaderData.rules.map((rule) => (
            <div
              key={rule.id}
              className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-600"
            >
              Weekday {rule.weekday} · {formatMinuteOfDay(rule.startMinuteOfDay)} -{" "}
              {formatMinuteOfDay(rule.endMinuteOfDay)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatMinuteOfDay(minuteOfDay: number) {
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  const normalizedHour = hour % 12 || 12;
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${normalizedHour}:${minute.toString().padStart(2, "0")} ${suffix}`;
}
