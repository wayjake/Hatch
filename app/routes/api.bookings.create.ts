import type { Route } from "./+types/api.bookings.create";
import { getAuthUserId, getOrCreateUser } from "~/lib/auth.server";
import { createBookingFromCredit } from "~/lib/booking.server";

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
    const booking = await createBookingFromCredit({
      bookingLinkSlug,
      userId,
      startsAtIso: startsAt,
    });

    return Response.json({ ok: true, bookingId: booking.id });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create booking.";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
