import { getAuthUserId, getOrCreateUser } from "~/lib/auth.server";
import {
  confirmRescheduledBooking,
  rescheduleConfirmedBooking,
} from "~/lib/booking.server";
import {
  checkGoogleCalendarAvailability,
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from "~/lib/google-calendar.server";
import { sendBookingRescheduleTelegramMessage } from "~/lib/telegram.server";

export async function action(args: any) {
  const userId = await getAuthUserId(args);
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  await getOrCreateUser(args);

  const formData = await args.request.formData();
  const bookingId = Number(formData.get("bookingId") || 0);
  const startsAt = String(formData.get("startsAt") || "");

  if (!bookingId || !startsAt) {
    return Response.json({ ok: false, error: "Missing reschedule parameters." }, { status: 400 });
  }

  try {
    const reservation = await rescheduleConfirmedBooking({
      bookingId,
      userId,
      startsAtIso: startsAt,
    });

    const availability = await checkGoogleCalendarAvailability({
      creatorId: reservation.creator.id,
      startsAt: reservation.newStartsAt,
      endsAt: reservation.newEndsAt,
    });

    if (!availability.available) {
      return Response.json(
        { ok: false, error: "That time is no longer available on the creator calendar." },
        { status: 400 }
      );
    }

    const event = await createGoogleCalendarEvent({
      creatorId: reservation.creator.id,
      title: `${reservation.bookingLink.title} with ${reservation.attendeeName}`,
      description: `Booked via Hatch.\nAttendee: ${reservation.attendeeName}\nEmail: ${reservation.attendeeEmail}`,
      startsAt: reservation.newStartsAt,
      endsAt: reservation.newEndsAt,
      timezone: reservation.creator.timezone,
      attendeeEmail: reservation.attendeeEmail,
      attendeeName: reservation.attendeeName,
    });

    const telegramResult = await sendBookingRescheduleTelegramMessage({
      creatorName: reservation.creator.displayName,
      attendeeName: reservation.attendeeName,
      attendeeEmail: reservation.attendeeEmail,
      oldStartsAt: reservation.oldStartsAt,
      newStartsAt: reservation.newStartsAt,
      timezone: reservation.creator.timezone,
      bookingLinkTitle: reservation.bookingLink.title,
    });

    const booking = await confirmRescheduledBooking({
      bookingId: reservation.booking.id,
      startsAt: reservation.newStartsAt,
      endsAt: reservation.newEndsAt,
      googleCalendarEventId: event.id,
      telegramMessageId: telegramResult.ok ? "sent" : null,
    });

    if (reservation.booking.googleCalendarEventId) {
      await deleteGoogleCalendarEvent({
        creatorId: reservation.creator.id,
        eventId: reservation.booking.googleCalendarEventId,
      });
    }

    return Response.json({ ok: true, bookingId: booking.id });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unable to reschedule booking.",
      },
      { status: 400 }
    );
  }
}
