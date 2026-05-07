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

  const [linkedOffers, creator] = await Promise.all([
    db.query.offers.findMany({
      where: eq(offers.creatorId, bookingLink.creatorId),
      orderBy: [asc(offers.priceCents)],
    }),
    db.query.creators.findFirst({
      where: eq(creators.id, bookingLink.creatorId),
    }),
  ]);

  return { bookingLink, offers: linkedOffers, creator };
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
  const rows = await db.query.bookings.findMany({
    where: and(eq(bookings.creatorId, creatorId), eq(bookings.status, "confirmed")),
    orderBy: [desc(bookings.startsAt)],
    limit: 10,
  });
  return enrichBookings(rows);
}

export async function getUpcomingBookingsForUser(userId: string) {
  const rows = await db.query.bookings.findMany({
    where: eq(bookings.userId, userId),
    orderBy: [desc(bookings.startsAt)],
    limit: 10,
  });
  return enrichBookings(rows);
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

export async function listAvailableSlotsForBookingLink(
  bookingLinkId: number,
  options?: { excludeBookingId?: number }
) {
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
        if (
          hasBookingConflict(
            cursor,
            endsAt,
            existingBookings,
            options?.excludeBookingId
          )
        ) {
          continue;
        }

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
        status: "pending",
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

    return {
      booking,
      bookingLink,
      creator,
      attendeeName:
        profile?.displayName ||
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.email,
      attendeeEmail: user.email,
    };
  });
}

export async function confirmPendingBooking(args: {
  bookingId: number;
  googleCalendarEventId?: string | null;
  telegramMessageId?: string | null;
}) {
  return db.transaction(async (tx) => {
    const booking = await tx.query.bookings.findFirst({
      where: eq(bookings.id, args.bookingId),
    });
    if (!booking) {
      throw new Error("Booking not found.");
    }
    if (!booking.userId) {
      throw new Error("Booking is missing a user.");
    }

    const existingConsumption = await tx.query.callCreditTransactions.findFirst({
      where: and(
        eq(callCreditTransactions.bookingId, booking.id),
        eq(callCreditTransactions.type, "consume")
      ),
    });

    if (!existingConsumption) {
      await tx.insert(callCreditTransactions).values({
        userId: booking.userId,
        creatorId: booking.creatorId,
        bookingId: booking.id,
        type: "consume",
        quantity: -1,
        note: `Credit consumed for booking #${booking.id}`,
      });
    }

    const [updated] = await tx
      .update(bookings)
      .set({
        status: "confirmed",
        googleCalendarEventId: args.googleCalendarEventId || null,
        telegramMessageId: args.telegramMessageId || null,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, booking.id))
      .returning();

    return updated || booking;
  });
}

export async function cancelPendingBooking(bookingId: number) {
  await db
    .delete(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.status, "pending")));
}

export async function cancelConfirmedBooking(args: {
  bookingId: number;
  userId: string;
  minimumNoticeHours?: number;
}) {
  const minimumNoticeHours = args.minimumNoticeHours ?? 24;

  return db.transaction(async (tx) => {
    const booking = await tx.query.bookings.findFirst({
      where: and(eq(bookings.id, args.bookingId), eq(bookings.userId, args.userId)),
    });
    if (!booking) {
      throw new Error("Booking not found.");
    }
    if (booking.status !== "confirmed") {
      throw new Error("Only confirmed bookings can be canceled.");
    }

    const cutoff = new Date(
      new Date(booking.startsAt).getTime() - minimumNoticeHours * 60 * 60 * 1000
    );
    if (Date.now() > cutoff.getTime()) {
      throw new Error("This booking is inside the cancellation window.");
    }

    const existingRefund = await tx.query.callCreditTransactions.findFirst({
      where: and(
        eq(callCreditTransactions.bookingId, booking.id),
        eq(callCreditTransactions.type, "refund")
      ),
    });

    if (!existingRefund) {
      await tx.insert(callCreditTransactions).values({
        userId: args.userId,
        creatorId: booking.creatorId,
        bookingId: booking.id,
        type: "refund",
        quantity: 1,
        note: `Credit restored from cancellation for booking #${booking.id}`,
      });
    }

    const [updated] = await tx
      .update(bookings)
      .set({
        status: "canceled",
        canceledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, booking.id))
      .returning();

    const creator = await tx.query.creators.findFirst({
      where: eq(creators.id, booking.creatorId),
    });
    const bookingLink = await tx.query.bookingLinks.findFirst({
      where: eq(bookingLinks.id, booking.bookingLinkId),
    });

    return {
      booking: updated || booking,
      creator,
      bookingLink,
    };
  });
}

export async function getReschedulableBookingForUser(args: {
  bookingId: number;
  userId: string;
}) {
  const booking = await db.query.bookings.findFirst({
    where: and(eq(bookings.id, args.bookingId), eq(bookings.userId, args.userId)),
  });
  if (!booking || booking.status !== "confirmed") {
    return null;
  }

  const cutoff = new Date(new Date(booking.startsAt).getTime() - 24 * 60 * 60 * 1000);
  if (Date.now() > cutoff.getTime()) {
    return null;
  }

  const bookingLink = await db.query.bookingLinks.findFirst({
    where: eq(bookingLinks.id, booking.bookingLinkId),
  });
  if (!bookingLink) {
    return null;
  }

  return { booking, bookingLink };
}

export async function rescheduleConfirmedBooking(args: {
  bookingId: number;
  userId: string;
  startsAtIso: string;
}) {
  const current = await getReschedulableBookingForUser({
    bookingId: args.bookingId,
    userId: args.userId,
  });
  if (!current) {
    throw new Error("This booking cannot be rescheduled.");
  }

  const startsAt = new Date(args.startsAtIso);
  if (Number.isNaN(startsAt.getTime())) {
    throw new Error("Invalid slot.");
  }

  const availableSlots = await listAvailableSlotsForBookingLink(current.bookingLink.id, {
    excludeBookingId: current.booking.id,
  });
  const chosenSlot = availableSlots.find((slot) => slot.startsAt === startsAt.toISOString());
  if (!chosenSlot) {
    throw new Error("This slot is no longer available.");
  }

  const creator = await db.query.creators.findFirst({
    where: eq(creators.id, current.booking.creatorId),
  });
  if (!creator) {
    throw new Error("Creator not found.");
  }

  return {
    booking: current.booking,
    bookingLink: current.bookingLink,
    creator,
    attendeeName: current.booking.attendeeName,
    attendeeEmail: current.booking.attendeeEmail,
    oldStartsAt: new Date(current.booking.startsAt),
    newStartsAt: startsAt,
    newEndsAt: new Date(chosenSlot.endsAt),
  };
}

export async function confirmRescheduledBooking(args: {
  bookingId: number;
  startsAt: Date;
  endsAt: Date;
  googleCalendarEventId?: string | null;
  telegramMessageId?: string | null;
}) {
  const [updated] = await db
    .update(bookings)
    .set({
      startsAt: args.startsAt,
      endsAt: args.endsAt,
      googleCalendarEventId: args.googleCalendarEventId || null,
      telegramMessageId: args.telegramMessageId || null,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, args.bookingId))
    .returning();

  if (!updated) {
    throw new Error("Failed to update booking.");
  }

  return updated;
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
  existingBookings: Array<typeof bookings.$inferSelect>,
  excludeBookingId?: number
) {
  return existingBookings.some(
    (booking) =>
      booking.id !== excludeBookingId &&
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

async function enrichBookings(rows: Array<typeof bookings.$inferSelect>) {
  if (rows.length === 0) return [];

  const linkIds = [...new Set(rows.map((row) => row.bookingLinkId))];
  const creatorIds = [...new Set(rows.map((row) => row.creatorId))];

  const [links, bookingCreators] = await Promise.all([
    db.query.bookingLinks.findMany({
      where: inArray(bookingLinks.id, linkIds),
    }),
    db.query.creators.findMany({
      where: inArray(creators.id, creatorIds),
    }),
  ]);

  const linksById = new Map(links.map((link) => [link.id, link]));
  const creatorsById = new Map(bookingCreators.map((creator) => [creator.id, creator]));

  return rows.map((row) => {
    const link = linksById.get(row.bookingLinkId);
    const creator = creatorsById.get(row.creatorId);
    return {
      ...row,
      bookingLinkTitle: link?.title || "Session",
      bookingLinkSlug: link?.slug || "",
      creatorDisplayName: creator?.displayName || "Creator",
      calendarConnected: Boolean(row.googleCalendarEventId),
      telegramSent: Boolean(row.telegramMessageId),
      canCancel:
        row.status === "confirmed" &&
        new Date(row.startsAt).getTime() - Date.now() > 24 * 60 * 60 * 1000,
      canReschedule:
        row.status === "confirmed" &&
        new Date(row.startsAt).getTime() - Date.now() > 24 * 60 * 60 * 1000,
      startsAtLabel: new Intl.DateTimeFormat("en-US", {
        timeZone: row.timezone,
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(row.startsAt)),
    };
  });
}
