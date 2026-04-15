import { redirect } from "react-router";
import { eq } from "drizzle-orm";
import { requireAdmin } from "~/lib/auth.server";
import { db } from "~/db";
import { creators } from "~/db/schema";
import { createGoogleCalendarAuthUrl } from "~/lib/google-calendar.server";

export async function loader(args: any) {
  const admin = await requireAdmin(args);
  const creator = await db.query.creators.findFirst({
    where: eq(creators.userId, admin.id),
  });

  if (!creator) {
    throw redirect("/admin/payments");
  }

  throw redirect(createGoogleCalendarAuthUrl(creator.id));
}
