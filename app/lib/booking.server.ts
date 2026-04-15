import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "~/db";
import {
  availabilityOverrides,
  availabilityRules,
  bookingLinks,
  bookings,
  callCreditTransactions,
  creators,
  offers,
  profiles,
  users,
} from "~/db/schema";

export async function getBookingLinkBySlug(slug: string) {
  return db.query.bookingLinks.findFirst({
    where: eq(bookingLinks.slug, slug),
  });
}

export async function getBookingLinkDetailBySlug(slug: string) {
  const bookingLink = await getBookingLinkBySlug(slug);
  if (!bookingLink) return null;

  const linkedOffers = await db.query.offers.findMany({
    where: eq(offers.creatorId, bookingLink.creatorId),
    orderBy: [asc(offers.priceCents)],
  });

  return { bookingLink, offers: linkedOffers };
}

export async function getBookingLinkSchedule(bookingLinkId: number) {
  const rules = await db.query.availabilityRules.findMany({
    where: and(
      eq(availabilityRules.bookingLinkId, bookingLinkId),
      eq(availabilityRules.isActive, true)
    ),
    orderBy: [asc(availabilityRules.weekday), asc(availabilityRules.startMinuteOfDay)],
  });

  const overrides = await db.query.availabilityOverrides.findMany({
    where: eq(availabilityOverrides.bookingLinkId, bookingLinkId),
    orderBy: [asc(availabilityOverrides.startsAt)],
  });

  return { rules, overrides };
}

export async function getCreatorByUserId(userId: string) {
  return db.query.creators.findFirst({
    where: eq(creators.userId, userId),
  });
}

export async function getActiveBookingLinksForCreator(creatorId: number) {
  return db.query.bookingLinks.findMany({
    where: and(
      eq(bookingLinks.creatorId, creatorId),
      eq(bookingLinks.isActive, true)
    ),
    orderBy: [asc(bookingLinks.createdAt)],
  });
}

export async function getUpcomingBookingsForCreator(creatorId: number) {
  return db.query.bookings.findMany({
    where: and(eq(bookings.creatorId, creatorId), eq(bookings.status, "confirmed")),
    orderBy: [desc(bookings.startsAt)],
    limit: 10,
  });
}

export async function getUpcomingBookingsForUser(userId: string) {
  return db.query.bookings.findMany({
    where: eq(bookings.userId, userId),
    orderBy: [desc(bookings.startsAt)],
    limit: 10,
  });
}

export async function getRemainingCallCredits(userId: string, creatorId: number) {
  const [result] = await db
    .select({
      total: sql<number>`coalesce(sum(${callCreditTransactions.quantity}), 0)`,
    })
    .from(callCreditTransactions)
    .where(
      and(
        eq(callCreditTransactions.userId, userId),
        eq(callCreditTransactions.creatorId, creatorId)
      )
    );

  return result?.total ?? 0;
}

export type BookingSlot = {
  startsAt: string;
  endsAt: string;
  label: string;
  dateLabel: string;
};

export async function listAvailableSlotsForBookingLink(bookingLinkId: number) {
  const bookingLink = await db.query.bookingLinks.findFirst({
    where: eq(bookingLinks.id, bookingLinkId),
  });
  if (!bookingLink) return [];
  const creator = await db.query.creators.findFirst({
    where: eq(creators.id, bookingLink.creatorId),
  });
  if (!creator) return [];

  const { rules, overrides } = await getBookingLinkSchedule(bookingLink.id);
  if (rules.length === 0) return [];

  const now = new Date();
  const horizonDays = Math.min(bookingLink.bookingHorizonDays, 21);
  const windowEnd = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000);

  const existingBookings = await db.query.bookings.findMany({
    where: and(
      eq(bookings.creatorId, bookingLink.creatorId),
      gte(bookings.startsAt, now),
      lte(bookings.startsAt, windowEnd),
      inArray(bookings.status, ["confirmed", "pending", "completed"])
    ),
    orderBy: [asc(bookings.startsAt)],
  });

  const slots: BookingSlot[] = [];
  const seen = new Set<string>();
  const minimumStart = new Date(
    now.getTime() + bookingLink.minimumNoticeHours * 60 * 60 * 1000
  );

  for (let dayOffset = 0; dayOffset <= horizonDays; dayOffset++) {
    const day = new Date(now);
    day.setDate(now.getDate() + dayOffset);
    const localDate = getTimeZoneDateParts(day, creator.timezone);

    for (const rule of rules) {
      if (rule.weekday !== localDate.weekday) continue;

      const slotStart = zonedDateTimeToUtc(
        localDate.year,
        localDate.month,
        localDate.day,
        Math.floor(rule.startMinuteOfDay / 60),
        rule.startMinuteOfDay % 60,
        creator.timezone
      );
      const slotEndBoundary = zonedDateTimeToUtc(
        localDate.year,
        localDate.month,
        localDate.day,
        Math.floor(rule.endMinuteOfDay / 60),
        rule.endMinuteOfDay % 60,
        creator.timezone
      );

      for (
        let cursor = new Date(slotStart);
        cursor.getTime() + bookingLink.durationMinutes * 60 * 1000 <= slotEndBoundary.getTime();
        cursor = new Date(
          cursor.getTime() +
            (bookingLink.durationMinutes +
              bookingLink.bufferBeforeMinutes +
              bookingLink.bufferAfterMinutes) *
              60 *
              1000
        )
      ) {
        if (cursor < minimumStart) continue;

        const endsAt = new Date(
          cursor.getTime() + bookingLink.durationMinutes * 60 * 1000
        );

        if (hasBlockingOverride(cursor, endsAt, overrides)) continue;
        if (hasBookingConflict(cursor, endsAt, existingBookings)) continue;

        const key = cursor.toISOString();
        if (seen.has(key)) continue;
        seen.add(key);

        slots.push({
          startsAt: cursor.toISOString(),
          endsAt: endsAt.toISOString(),
          label: formatTimeLabel(cursor, creator.timezone),
          dateLabel: formatDateLabel(cursor, creator.timezone),
        });
      }
    }
  }

  return slots.slice(0, 40);
}

export async function createBookingFromCredit(args: {
  bookingLinkSlug: string;
  userId: string;
  startsAtIso: string;
}) {
  const bookingLink = await getBookingLinkBySlug(args.bookingLinkSlug);
  if (!bookingLink) {
    throw new Error("Booking link not found.");
  }

  const startsAt = new Date(args.startsAtIso);
  if (Number.isNaN(startsAt.getTime())) {
    throw new Error("Invalid slot.");
  }

  const availableSlots = await listAvailableSlotsForBookingLink(bookingLink.id);
  const chosenSlot = availableSlots.find((slot) => slot.startsAt === startsAt.toISOString());
  if (!chosenSlot) {
    throw new Error("This slot is no longer available.");
  }

  const [user, profile] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, args.userId) }),
    db.query.profiles.findFirst({ where: eq(profiles.userId, args.userId) }),
  ]);
  const creator = await db.query.creators.findFirst({
    where: eq(creators.id, bookingLink.creatorId),
  });

  if (!user || !creator) {
    throw new Error("User not found.");
  }

  return db.transaction(async (tx) => {
    const [creditBalance] = await tx
      .select({
        total: sql<number>`coalesce(sum(${callCreditTransactions.quantity}), 0)`,
      })
      .from(callCreditTransactions)
      .where(
        and(
          eq(callCreditTransactions.userId, args.userId),
          eq(callCreditTransactions.creatorId, bookingLink.creatorId)
        )
      );

    if ((creditBalance?.total ?? 0) < 1) {
      throw new Error("You do not have any call credits remaining.");
    }

    const conflictingBooking = await tx.query.bookings.findFirst({
      where: and(
        eq(bookings.creatorId, bookingLink.creatorId),
        eq(bookings.startsAt, startsAt),
        inArray(bookings.status, ["confirmed", "pending", "completed"])
      ),
    });

    if (conflictingBooking) {
      throw new Error("That slot has already been booked.");
    }

    const [booking] = await tx
      .insert(bookings)
      .values({
        bookingLinkId: bookingLink.id,
        creatorId: bookingLink.creatorId,
        userId: user.id,
        status: "confirmed",
        startsAt,
        endsAt: new Date(chosenSlot.endsAt),
        timezone: creator.timezone,
        attendeeName:
          profile?.displayName ||
          [user.firstName, user.lastName].filter(Boolean).join(" ") ||
          user.email,
        attendeeEmail: user.email,
      })
      .returning();

    if (!booking) {
      throw new Error("Failed to create booking.");
    }

    await tx.insert(callCreditTransactions).values({
      userId: user.id,
      creatorId: bookingLink.creatorId,
      bookingId: booking.id,
      type: "consume",
      quantity: -1,
      note: `Credit consumed for booking #${booking.id}`,
    });

    return booking;
  });
}

function hasBlockingOverride(
  startsAt: Date,
  endsAt: Date,
  overrides: Array<typeof availabilityOverrides.$inferSelect>
) {
  return overrides.some((override) => {
    const overlaps =
      startsAt < new Date(override.endsAt) && endsAt > new Date(override.startsAt);
    return overlaps && !override.isAvailable;
  });
}

function hasBookingConflict(
  startsAt: Date,
  endsAt: Date,
  existingBookings: Array<typeof bookings.$inferSelect>
) {
  return existingBookings.some(
    (booking) =>
      startsAt < new Date(booking.endsAt) && endsAt > new Date(booking.startsAt)
  );
}

function getTimeZoneDateParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
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

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: weekdayMap[parts.weekday as string],
  };
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

function formatDateLabel(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatTimeLabel(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
