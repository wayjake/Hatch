import { and, eq } from "drizzle-orm";
import { db } from "~/db";
import { creatorIntegrations } from "~/db/schema";

const GOOGLE_CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly";

export function getGoogleCalendarConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirectUri: process.env.GOOGLE_REDIRECT_URI || "",
  };
}

export function isGoogleCalendarConfigured() {
  const config = getGoogleCalendarConfig();
  return Boolean(config.clientId && config.clientSecret && config.redirectUri);
}

export async function getCreatorGoogleCalendarIntegration(creatorId: number) {
  return db.query.creatorIntegrations.findFirst({
    where: and(
      eq(creatorIntegrations.creatorId, creatorId),
      eq(creatorIntegrations.type, "google_calendar")
    ),
  });
}

export function createGoogleCalendarAuthUrl(creatorId: number) {
  const config = getGoogleCalendarConfig();
  if (!config.clientId || !config.redirectUri) {
    throw new Error("Google Calendar OAuth is not configured.");
  }

  const state = Buffer.from(JSON.stringify({ creatorId }), "utf8").toString("base64url");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("scope", GOOGLE_CALENDAR_SCOPE);
  url.searchParams.set("state", state);
  return url.toString();
}

export function parseGoogleCalendarState(state: string) {
  const payload = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
  return {
    creatorId: Number(payload.creatorId || 0),
  };
}

export async function exchangeGoogleCalendarCode(args: {
  code: string;
  creatorId: number;
}) {
  const config = getGoogleCalendarConfig();
  const body = new URLSearchParams({
    code: args.code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error("Failed to exchange Google authorization code.");
  }

  const tokens = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  await db
    .insert(creatorIntegrations)
    .values({
      creatorId: args.creatorId,
      type: "google_calendar",
      status: "active",
      externalAccountId: "primary",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      connectedAt: new Date(),
      metadata: JSON.stringify({ calendarId: "primary" }),
    })
    .onConflictDoUpdate({
      target: [creatorIntegrations.creatorId, creatorIntegrations.type],
      set: {
        status: "active",
        externalAccountId: "primary",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        connectedAt: new Date(),
        metadata: JSON.stringify({ calendarId: "primary" }),
        updatedAt: new Date(),
      },
    });
}

export async function ensureGoogleCalendarAccessToken(creatorId: number) {
  const integration = await getCreatorGoogleCalendarIntegration(creatorId);
  if (!integration) {
    throw new Error("Google Calendar is not connected.");
  }

  if (
    integration.accessToken &&
    integration.expiresAt &&
    new Date(integration.expiresAt).getTime() > Date.now() + 60_000
  ) {
    return {
      accessToken: integration.accessToken,
      calendarId: getCalendarId(integration.metadata),
    };
  }

  if (!integration.refreshToken) {
    throw new Error("Google Calendar refresh token is missing.");
  }

  const config = getGoogleCalendarConfig();
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: integration.refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    throw new Error("Failed to refresh Google Calendar token.");
  }

  const tokens = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  await db
    .update(creatorIntegrations)
    .set({
      accessToken: tokens.access_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      updatedAt: new Date(),
    })
    .where(eq(creatorIntegrations.id, integration.id));

  return {
    accessToken: tokens.access_token,
    calendarId: getCalendarId(integration.metadata),
  };
}

export async function checkGoogleCalendarAvailability(args: {
  creatorId: number;
  startsAt: Date;
  endsAt: Date;
}) {
  const integration = await getCreatorGoogleCalendarIntegration(args.creatorId);
  if (!integration) {
    return { connected: false, available: true };
  }

  const { accessToken, calendarId } = await ensureGoogleCalendarAccessToken(args.creatorId);
  const response = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin: args.startsAt.toISOString(),
      timeMax: args.endsAt.toISOString(),
      items: [{ id: calendarId }],
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to query Google Calendar availability.");
  }

  const data = (await response.json()) as {
    calendars: Record<string, { busy: Array<{ start: string; end: string }> }>;
  };

  const busy = data.calendars?.[calendarId]?.busy || [];
  return {
    connected: true,
    available: busy.length === 0,
  };
}

export async function createGoogleCalendarEvent(args: {
  creatorId: number;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  attendeeEmail: string;
  attendeeName: string;
}) {
  const { accessToken, calendarId } = await ensureGoogleCalendarAccessToken(args.creatorId);
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: args.title,
        description: args.description,
        start: {
          dateTime: args.startsAt.toISOString(),
          timeZone: args.timezone,
        },
        end: {
          dateTime: args.endsAt.toISOString(),
          timeZone: args.timezone,
        },
        attendees: [
          {
            email: args.attendeeEmail,
            displayName: args.attendeeName,
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to create Google Calendar event.");
  }

  const event = (await response.json()) as { id: string };
  return event;
}

export async function deleteGoogleCalendarEvent(args: {
  creatorId: number;
  eventId: string;
}) {
  const { accessToken, calendarId } = await ensureGoogleCalendarAccessToken(args.creatorId);
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(args.eventId)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    throw new Error("Failed to delete Google Calendar event.");
  }
}

function getCalendarId(metadata: string) {
  try {
    const parsed = JSON.parse(metadata) as { calendarId?: string };
    return parsed.calendarId || "primary";
  } catch {
    return "primary";
  }
}
