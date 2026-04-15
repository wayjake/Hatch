import { and, eq } from "drizzle-orm";
import type { Route } from "./+types/admin.availability";
import { db } from "~/db";
import {
  availabilityOverrides,
  availabilityRules,
  bookingLinks,
  creators,
} from "~/db/schema";
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
  const overrides = links.length
    ? await db.query.availabilityOverrides.findMany({
        where: eq(availabilityOverrides.bookingLinkId, links[0].id),
      })
    : [];

  return { creator, links, rules, overrides };
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

  if (intent === "create-rule") {
    const bookingLinkId = Number(formData.get("bookingLinkId") || 0);
    const weekday = Number(formData.get("weekday") || -1);
    const startTime = String(formData.get("startTime") || "");
    const endTime = String(formData.get("endTime") || "");

    const bookingLink = await db.query.bookingLinks.findFirst({
      where: and(
        eq(bookingLinks.id, bookingLinkId),
        eq(bookingLinks.creatorId, creator.id)
      ),
    });

    if (!bookingLink || weekday < 0 || weekday > 6 || !startTime || !endTime) {
      return { ok: false, error: "Missing recurring rule details." };
    }

    const startMinuteOfDay = parseTimeToMinuteOfDay(startTime);
    const endMinuteOfDay = parseTimeToMinuteOfDay(endTime);

    if (endMinuteOfDay <= startMinuteOfDay) {
      return { ok: false, error: "End time must be after the start time." };
    }

    await db.insert(availabilityRules).values({
      bookingLinkId,
      weekday,
      startMinuteOfDay,
      endMinuteOfDay,
    });

    return { ok: true };
  }

  if (intent === "delete-rule") {
    const ruleId = Number(formData.get("ruleId") || 0);
    if (!ruleId) {
      return { ok: false, error: "Missing recurring rule." };
    }

    const rule = await db.query.availabilityRules.findFirst({
      where: eq(availabilityRules.id, ruleId),
    });
    if (!rule) {
      return { ok: false, error: "Recurring rule not found." };
    }

    const bookingLink = await db.query.bookingLinks.findFirst({
      where: and(
        eq(bookingLinks.id, rule.bookingLinkId),
        eq(bookingLinks.creatorId, creator.id)
      ),
    });
    if (!bookingLink) {
      return { ok: false, error: "Recurring rule not owned by this creator." };
    }

    await db.delete(availabilityRules).where(eq(availabilityRules.id, rule.id));
    return { ok: true };
  }

  if (intent === "create-override") {
    const bookingLinkId = Number(formData.get("bookingLinkId") || 0);
    const date = String(formData.get("date") || "");
    const startTime = String(formData.get("startTime") || "");
    const endTime = String(formData.get("endTime") || "");
    const type = String(formData.get("type") || "blocked");
    const note = String(formData.get("note") || "");

    const bookingLink = await db.query.bookingLinks.findFirst({
      where: and(
        eq(bookingLinks.id, bookingLinkId),
        eq(bookingLinks.creatorId, creator.id)
      ),
    });

    if (!bookingLink || !date || !startTime || !endTime) {
      return { ok: false, error: "Missing override details." };
    }

    const startsAt = parseCreatorDateTime(date, startTime, creator.timezone);
    const endsAt = parseCreatorDateTime(date, endTime, creator.timezone);

    if (endsAt <= startsAt) {
      return { ok: false, error: "End time must be after the start time." };
    }

    await db.insert(availabilityOverrides).values({
      bookingLinkId: bookingLink.id,
      startsAt,
      endsAt,
      isAvailable: type === "open",
      note,
    });

    return { ok: true };
  }

  if (intent === "delete-override") {
    const overrideId = Number(formData.get("overrideId") || 0);
    if (!overrideId) {
      return { ok: false, error: "Missing override." };
    }

    const override = await db.query.availabilityOverrides.findFirst({
      where: eq(availabilityOverrides.id, overrideId),
    });
    if (!override) {
      return { ok: false, error: "Override not found." };
    }

    const bookingLink = await db.query.bookingLinks.findFirst({
      where: and(
        eq(bookingLinks.id, override.bookingLinkId),
        eq(bookingLinks.creatorId, creator.id)
      ),
    });
    if (!bookingLink) {
      return { ok: false, error: "Override not owned by this creator." };
    }

    await db.delete(availabilityOverrides).where(eq(availabilityOverrides.id, override.id));
    return { ok: true };
  }

  return { ok: false, error: "Unknown action." };
}

export default function AdminAvailability({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Availability</h1>
      <p className="max-w-2xl text-sm text-gray-500">
        Recurring windows and one-off overrides will be edited here before being
        intersected with Google Calendar busy events.
      </p>

      {actionData?.error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {actionData.error}
        </div>
      )}
      {actionData?.ok && (
        <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
          Availability updated.
        </div>
      )}

      {loaderData.rules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
          No recurring availability rules yet. Seed a default booking link first.
        </div>
      ) : (
        <div className="space-y-6">
          {loaderData.links.length > 0 && (
            <form method="post" className="rounded-xl border border-gray-100 bg-white p-5">
              <input type="hidden" name="intent" value="create-rule" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Recurring Weekly Window</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Add a weekday window that repeats every week for a booking link.
                </p>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm text-gray-600">
                  <span>Booking Link</span>
                  <select
                    name="bookingLinkId"
                    defaultValue={String(loaderData.links[0].id)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                  >
                    {loaderData.links.map((link) => (
                      <option key={link.id} value={link.id}>
                        {link.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm text-gray-600">
                  <span>Weekday</span>
                  <select
                    name="weekday"
                    defaultValue="1"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                  >
                    {WEEKDAYS.map((weekday) => (
                      <option key={weekday.value} value={weekday.value}>
                        {weekday.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm text-gray-600">
                  <span>Start</span>
                  <input
                    type="time"
                    name="startTime"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                    required
                  />
                </label>

                <label className="space-y-1 text-sm text-gray-600">
                  <span>End</span>
                  <input
                    type="time"
                    name="endTime"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                    required
                  />
                </label>
              </div>

              <button className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
                Add Recurring Window
              </button>
            </form>
          )}

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Recurring Windows</h2>
            {loaderData.rules.map((rule) => {
              const link = loaderData.links.find((item) => item.id === rule.bookingLinkId);
              return (
                <form
                  key={rule.id}
                  method="post"
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-600"
                >
                  <input type="hidden" name="intent" value="delete-rule" />
                  <input type="hidden" name="ruleId" value={rule.id} />
                  <div>
                    <p className="font-medium text-gray-900">{link?.title || "Booking Link"}</p>
                    <p className="mt-1">
                      {formatWeekday(rule.weekday)} ·{" "}
                      {formatMinuteOfDay(rule.startMinuteOfDay)} -{" "}
                      {formatMinuteOfDay(rule.endMinuteOfDay)}
                    </p>
                  </div>
                  <button className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                    Delete
                  </button>
                </form>
              );
            })}
          </div>

          {loaderData.links.length > 0 && loaderData.creator && (
            <form method="post" className="rounded-xl border border-gray-100 bg-white p-5">
              <input type="hidden" name="intent" value="create-override" />
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">One-off Override</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Enter times in {loaderData.creator.timezone}. Block a window or force-open one.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm text-gray-600">
                  <span>Booking Link</span>
                  <select
                    name="bookingLinkId"
                    defaultValue={String(loaderData.links[0].id)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                  >
                    {loaderData.links.map((link) => (
                      <option key={link.id} value={link.id}>
                        {link.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm text-gray-600">
                  <span>Type</span>
                  <select
                    name="type"
                    defaultValue="blocked"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                  >
                    <option value="blocked">Blocked Window</option>
                    <option value="open">Force Open Window</option>
                  </select>
                </label>

                <label className="space-y-1 text-sm text-gray-600">
                  <span>Date</span>
                  <input
                    type="date"
                    name="date"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                    required
                  />
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="space-y-1 text-sm text-gray-600">
                    <span>Start</span>
                    <input
                      type="time"
                      name="startTime"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2"
                      required
                    />
                  </label>
                  <label className="space-y-1 text-sm text-gray-600">
                    <span>End</span>
                    <input
                      type="time"
                      name="endTime"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2"
                      required
                    />
                  </label>
                </div>
              </div>

              <label className="mt-4 block space-y-1 text-sm text-gray-600">
                <span>Note</span>
                <input
                  type="text"
                  name="note"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2"
                  placeholder="Optional note for why this exception exists"
                />
              </label>

              <button className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
                Save Override
              </button>
            </form>
          )}

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">One-off Overrides</h2>
            {loaderData.overrides.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
                No one-off overrides yet.
              </div>
            ) : (
              loaderData.overrides.map((override) => (
                <form
                  key={override.id}
                  method="post"
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3"
                >
                  <input type="hidden" name="intent" value="delete-override" />
                  <input type="hidden" name="overrideId" value={override.id} />
                  <div>
                    <p className="font-medium text-gray-900">
                      {override.isAvailable ? "Force Open" : "Blocked"} ·{" "}
                      {formatDateTime(override.startsAt, loaderData.creator?.timezone)} -{" "}
                      {formatDateTime(override.endsAt, loaderData.creator?.timezone)}
                    </p>
                    {override.note && (
                      <p className="mt-1 text-sm text-gray-500">{override.note}</p>
                    )}
                  </div>
                  <button className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                    Delete
                  </button>
                </form>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatWeekday(weekday: number) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][weekday] || weekday;
}

const WEEKDAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

function formatMinuteOfDay(minuteOfDay: number) {
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  const normalizedHour = hour % 12 || 12;
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${normalizedHour}:${minute.toString().padStart(2, "0")} ${suffix}`;
}

function formatDateTime(date: Date, timeZone = "America/Los_Angeles") {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function parseCreatorDateTime(date: string, time: string, timeZone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return zonedDateTimeToUtc(year, month, day, hour, minute, timeZone);
}

function parseTimeToMinuteOfDay(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
) {
  let guess = new Date(Date.UTC(year, month - 1, day, hour, minute));

  for (let i = 0; i < 3; i++) {
    const parts = getTimeZoneDateParts(guess, timeZone);
    const desiredUtc = Date.UTC(year, month - 1, day, hour, minute);
    const actualUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute
    );
    const diffMinutes = Math.round((desiredUtc - actualUtc) / 60000);
    if (diffMinutes === 0) break;
    guess = new Date(guess.getTime() + diffMinutes * 60000);
  }

  return guess;
}

function getTimeZoneDateParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}
