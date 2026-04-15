import { redirect } from "react-router";
import {
  exchangeGoogleCalendarCode,
  parseGoogleCalendarState,
} from "~/lib/google-calendar.server";

export async function loader(args: any) {
  const url = new URL(args.request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    throw redirect("/admin/payments");
  }

  const { creatorId } = parseGoogleCalendarState(state);
  if (!creatorId) {
    throw redirect("/admin/payments");
  }

  await exchangeGoogleCalendarCode({
    code,
    creatorId,
  });

  throw redirect("/admin/payments?google=connected");
}
