import type { Route } from "./+types/api.bookings.create";
import { getAuthUserId, getOrCreateUser } from "~/lib/auth.server";
import {
  cancelPendingBooking,
  confirmPendingBooking,
  createBookingFromCredit,
} from "~/lib/booking.server";
import {
  checkGoogleCalendarAvailability,
  createGoogleCalendarEvent,
} from "~/lib/google-calendar.server";
import { sendBookingTelegramMessage } from "~/lib/telegram.server";

export async function action(args: Route.ActionArgs) {
  const userId = await getAuthUserId(args);
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  await getOrCreateUser(args);

  const formData = await args.request.formData();
  const bookingLinkSlug = String(formData.get("bookingLinkSlug") || "");
  const startsAt = String(formData.get("startsAt") || "");

  if (!bookingLinkSlug || !startsAt) {
    return Response.json(
      { ok: false, error: "Missing booking parameters." },
      { status: 400 }
    );
  }

  try {
    const reservation = await createBookingFromCredit({
      bookingLinkSlug,
      userId,
      startsAtIso: startsAt,
    });

    const availability = await checkGoogleCalendarAvailability({
      creatorId: reservation.creator.id,
      startsAt: new Date(reservation.booking.startsAt),
      endsAt: new Date(reservation.booking.endsAt),
    });

    if (!availability.available) {
      await cancelPendingBooking(reservation.booking.id);
      return Response.json(
        { ok: false, error: "That time is no longer available on the creator calendar." },
        { status: 400 }
      );
    }

    let googleCalendarEventId: string | null = null;
    try {
      const event = await createGoogleCalendarEvent({
        creatorId: reservation.creator.id,
        title: `${reservation.bookingLink.title} with ${reservation.attendeeName}`,
        description: `Booked via Hatch.\nAttendee: ${reservation.attendeeName}\nEmail: ${reservation.attendeeEmail}`,
        startsAt: new Date(reservation.booking.startsAt),
        endsAt: new Date(reservation.booking.endsAt),
        timezone: reservation.creator.timezone,
        attendeeEmail: reservation.attendeeEmail,
        attendeeName: reservation.attendeeName,
      });
      googleCalendarEventId = event.id;
    } catch (error) {
      await cancelPendingBooking(reservation.booking.id);
      throw error;
    }

    const telegramResult = await sendBookingTelegramMessage({
      creatorName: reservation.creator.displayName,
      attendeeName: reservation.attendeeName,
      attendeeEmail: reservation.attendeeEmail,
      startsAt: new Date(reservation.booking.startsAt),
      timezone: reservation.creator.timezone,
      bookingLinkTitle: reservation.bookingLink.title,
    });

    const booking = await confirmPendingBooking({
      bookingId: reservation.booking.id,
      googleCalendarEventId,
      telegramMessageId: telegramResult.ok ? "sent" : null,
    });

    return Response.json({ ok: true, bookingId: booking.id });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create booking.";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
