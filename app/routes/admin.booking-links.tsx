import { and, eq } from "drizzle-orm";
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

  const creator = await db.query.creators.findFirst({
    where: eq(creators.userId, admin.id),
  });
  if (!creator) {
    return { ok: false, error: "Create a creator profile first." };
  }

  if (intent === "seed-default-link") {
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

  if (intent === "create-link") {
    const slug = String(formData.get("slug") || "").trim();
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const durationMinutes = Number(formData.get("durationMinutes") || 0);

    if (!slug || !title || durationMinutes < 15) {
      return { ok: false, error: "Slug, title, and a valid duration are required." };
    }

    await db.insert(bookingLinks).values({
      creatorId: creator.id,
      slug,
      title,
      description,
      durationMinutes,
      allowedOfferTypes: JSON.stringify(["session_single", "session_pack"]),
    });

    return { ok: true };
  }

  if (intent === "update-link") {
    const bookingLinkId = Number(formData.get("bookingLinkId") || 0);
    const existing = await db.query.bookingLinks.findFirst({
      where: and(
        eq(bookingLinks.id, bookingLinkId),
        eq(bookingLinks.creatorId, creator.id)
      ),
    });
    if (!existing) {
      return { ok: false, error: "Booking link not found." };
    }

    const slug = String(formData.get("slug") || "").trim();
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const durationMinutes = Number(formData.get("durationMinutes") || 0);
    const bufferBeforeMinutes = Number(formData.get("bufferBeforeMinutes") || 0);
    const bufferAfterMinutes = Number(formData.get("bufferAfterMinutes") || 0);
    const minimumNoticeHours = Number(formData.get("minimumNoticeHours") || 0);
    const bookingHorizonDays = Number(formData.get("bookingHorizonDays") || 0);
    const maxBookingsPerDayValue = String(formData.get("maxBookingsPerDay") || "").trim();
    const requiresPayment = formData.get("requiresPayment") === "on";
    const isActive = formData.get("isActive") === "on";

    if (!slug || !title || durationMinutes < 15 || bookingHorizonDays < 1) {
      return { ok: false, error: "Fill in the required booking link settings." };
    }

    await db
      .update(bookingLinks)
      .set({
        slug,
        title,
        description,
        durationMinutes,
        bufferBeforeMinutes,
        bufferAfterMinutes,
        minimumNoticeHours,
        bookingHorizonDays,
        maxBookingsPerDay: maxBookingsPerDayValue
          ? Number(maxBookingsPerDayValue)
          : null,
        requiresPayment,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(bookingLinks.id, existing.id));

    return { ok: true };
  }

  if (intent === "delete-link") {
    const bookingLinkId = Number(formData.get("bookingLinkId") || 0);
    const existing = await db.query.bookingLinks.findFirst({
      where: and(
        eq(bookingLinks.id, bookingLinkId),
        eq(bookingLinks.creatorId, creator.id)
      ),
    });
    if (!existing) {
      return { ok: false, error: "Booking link not found." };
    }

    await db.delete(availabilityRules).where(eq(availabilityRules.bookingLinkId, existing.id));
    await db.delete(bookingLinks).where(eq(bookingLinks.id, existing.id));
    return { ok: true };
  }

  return { ok: false, error: "Unknown action." };
}

export default function AdminBookingLinks({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Booking Links</h1>
      <p className="max-w-2xl text-sm text-gray-500">
        This screen will manage Calendly-style booking links, including duration,
        availability rules, accepted offers, and payment requirements.
      </p>

      {actionData?.error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {actionData.error}
        </div>
      )}
      {actionData?.ok && (
        <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
          Booking links updated.
        </div>
      )}

      {!loaderData.creator ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
          Create a creator profile in Payments first.
        </div>
      ) : (
        <>
          <form method="post" className="rounded-xl border border-gray-100 bg-white p-6">
            <input type="hidden" name="intent" value="create-link" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Create Booking Link</h2>
              <p className="mt-1 text-sm text-gray-500">
                Create a new public booking URL with its own rule set.
              </p>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm text-gray-600">
                <span>Slug</span>
                <input
                  type="text"
                  name="slug"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2"
                  placeholder="founder-call"
                  required
                />
              </label>
              <label className="space-y-1 text-sm text-gray-600">
                <span>Title</span>
                <input
                  type="text"
                  name="title"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2"
                  placeholder="Founder Call"
                  required
                />
              </label>
              <label className="space-y-1 text-sm text-gray-600 md:col-span-2">
                <span>Description</span>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2"
                  placeholder="Describe what this booking link is for."
                />
              </label>
              <label className="space-y-1 text-sm text-gray-600">
                <span>Duration (minutes)</span>
                <input
                  type="number"
                  name="durationMinutes"
                  min="15"
                  step="15"
                  defaultValue="60"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2"
                  required
                />
              </label>
            </div>

            <button className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
              Create Booking Link
            </button>
          </form>

          {loaderData.links.length === 0 ? (
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
            <div className="space-y-4">
              {loaderData.links.map((link) => (
                <form
                  key={link.id}
                  method="post"
                  className="rounded-xl border border-gray-100 bg-white p-5"
                >
                  <input type="hidden" name="intent" value="update-link" />
                  <input type="hidden" name="bookingLinkId" value={link.id} />

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-1 text-sm text-gray-600">
                      <span>Slug</span>
                      <input
                        type="text"
                        name="slug"
                        defaultValue={link.slug}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2"
                        required
                      />
                    </label>
                    <label className="space-y-1 text-sm text-gray-600">
                      <span>Title</span>
                      <input
                        type="text"
                        name="title"
                        defaultValue={link.title}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2"
                        required
                      />
                    </label>

                    <label className="space-y-1 text-sm text-gray-600 md:col-span-2">
                      <span>Description</span>
                      <textarea
                        name="description"
                        rows={3}
                        defaultValue={link.description}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2"
                      />
                    </label>

                    <label className="space-y-1 text-sm text-gray-600">
                      <span>Duration</span>
                      <input
                        type="number"
                        name="durationMinutes"
                        min="15"
                        step="15"
                        defaultValue={link.durationMinutes}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2"
                        required
                      />
                    </label>
                    <label className="space-y-1 text-sm text-gray-600">
                      <span>Min Notice Hours</span>
                      <input
                        type="number"
                        name="minimumNoticeHours"
                        min="0"
                        defaultValue={link.minimumNoticeHours}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2"
                        required
                      />
                    </label>
                    <label className="space-y-1 text-sm text-gray-600">
                      <span>Booking Horizon Days</span>
                      <input
                        type="number"
                        name="bookingHorizonDays"
                        min="1"
                        defaultValue={link.bookingHorizonDays}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2"
                        required
                      />
                    </label>
                    <label className="space-y-1 text-sm text-gray-600">
                      <span>Max Bookings / Day</span>
                      <input
                        type="number"
                        name="maxBookingsPerDay"
                        min="1"
                        defaultValue={link.maxBookingsPerDay ?? ""}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2"
                        placeholder="Unlimited"
                      />
                    </label>
                    <label className="space-y-1 text-sm text-gray-600">
                      <span>Buffer Before (min)</span>
                      <input
                        type="number"
                        name="bufferBeforeMinutes"
                        min="0"
                        defaultValue={link.bufferBeforeMinutes}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2"
                        required
                      />
                    </label>
                    <label className="space-y-1 text-sm text-gray-600">
                      <span>Buffer After (min)</span>
                      <input
                        type="number"
                        name="bufferAfterMinutes"
                        min="0"
                        defaultValue={link.bufferAfterMinutes}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2"
                        required
                      />
                    </label>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="requiresPayment"
                        defaultChecked={link.requiresPayment}
                      />
                      Requires payment
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="isActive" defaultChecked={link.isActive} />
                      Active
                    </label>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <p className="text-sm text-gray-500">/book/{link.slug}</p>
                    <div className="flex gap-3">
                      <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
                        Save Changes
                      </button>
                      <button
                        type="submit"
                        name="intent"
                        value="delete-link"
                        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </form>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
