import { eq } from "drizzle-orm";
import type { Route } from "./+types/admin.booking-links";
import { db } from "~/db";
import { availabilityRules, bookingLinks, creators } from "~/db/schema";
import { requireAdmin } from "~/lib/auth.server";

export function meta() {
  return [{ title: "Booking Links — Admin — Hatch" }];
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

  return { creator, links };
}

export async function action(args: Route.ActionArgs) {
  const admin = await requireAdmin(args);
  const formData = await args.request.formData();
  const intent = String(formData.get("intent") || "");

  if (intent !== "seed-default-link") {
    return { ok: false };
  }

  const creator = await db.query.creators.findFirst({
    where: eq(creators.userId, admin.id),
  });
  if (!creator) {
    return { ok: false, error: "Create a creator profile first." };
  }

  const existing = await db.query.bookingLinks.findFirst({
    where: eq(bookingLinks.creatorId, creator.id),
  });
  if (!existing) {
    const [link] = await db
      .insert(bookingLinks)
      .values({
        creatorId: creator.id,
        slug: `${creator.slug}-coaching`,
        title: "1:1 Coaching Call",
        description: "Use one credit to book a 60-minute session.",
        durationMinutes: 60,
        allowedOfferTypes: JSON.stringify(["session_single", "session_pack"]),
      })
      .returning();

    if (link) {
      await db.insert(availabilityRules).values([
        {
          bookingLinkId: link.id,
          weekday: 1,
          startMinuteOfDay: 9 * 60,
          endMinuteOfDay: 17 * 60,
        },
        {
          bookingLinkId: link.id,
          weekday: 2,
          startMinuteOfDay: 9 * 60,
          endMinuteOfDay: 17 * 60,
        },
        {
          bookingLinkId: link.id,
          weekday: 3,
          startMinuteOfDay: 9 * 60,
          endMinuteOfDay: 17 * 60,
        },
        {
          bookingLinkId: link.id,
          weekday: 4,
          startMinuteOfDay: 9 * 60,
          endMinuteOfDay: 17 * 60,
        },
        {
          bookingLinkId: link.id,
          weekday: 5,
          startMinuteOfDay: 9 * 60,
          endMinuteOfDay: 17 * 60,
        },
      ]);
    }
  }

  return { ok: true };
}

export default function AdminBookingLinks({ loaderData }: Route.ComponentProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Booking Links</h1>
      <p className="max-w-2xl text-sm text-gray-500">
        This screen will manage Calendly-style booking links, including duration,
        availability rules, accepted offers, and payment requirements.
      </p>

      {!loaderData.creator ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
          Create a creator profile in Payments first.
        </div>
      ) : loaderData.links.length === 0 ? (
        <form method="post" className="rounded-xl border border-gray-100 bg-white p-6">
          <input type="hidden" name="intent" value="seed-default-link" />
          <p className="text-sm text-gray-500">
            Seed a default 60-minute coaching link with Monday-Friday, 9am-5pm availability.
          </p>
          <button className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
            Create Default Booking Link
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          {loaderData.links.map((link) => (
            <div
              key={link.id}
              className="rounded-xl border border-gray-100 bg-white p-5"
            >
              <p className="font-medium text-gray-900">{link.title}</p>
              <p className="mt-1 text-sm text-gray-500">
                {link.durationMinutes} minutes · /book/{link.slug}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
