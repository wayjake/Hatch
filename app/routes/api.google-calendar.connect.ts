import { redirect } from "react-router";
import { requireCreatorAdmin } from "~/lib/auth.server";
import { createGoogleCalendarAuthUrl } from "~/lib/google-calendar.server";

export async function loader(args: any) {
  const { creator } = await requireCreatorAdmin(args);

  if (!creator) {
    throw redirect("/admin/payments");
  }

  throw redirect(createGoogleCalendarAuthUrl(creator.id));
}
