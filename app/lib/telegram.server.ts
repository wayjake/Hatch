export async function sendTelegramMessage(message: string) {
  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return { ok: false as const, skipped: true as const };
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
    }),
  });

  return {
    ok: response.ok,
    skipped: false as const,
  };
}

export async function sendBookingTelegramMessage(args: {
  creatorName: string;
  attendeeName: string;
  attendeeEmail: string;
  startsAt: Date;
  timezone: string;
  bookingLinkTitle: string;
}) {
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: args.timezone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(args.startsAt);

  const message =
    `New booking confirmed\n\n` +
    `Creator: ${args.creatorName}\n` +
    `Link: ${args.bookingLinkTitle}\n` +
    `Attendee: ${args.attendeeName}\n` +
    `Email: ${args.attendeeEmail}\n` +
    `Time: ${time} (${args.timezone})`;

  return sendTelegramMessage(message);
}

export async function sendBookingCancellationTelegramMessage(args: {
  creatorName: string;
  attendeeName: string;
  attendeeEmail: string;
  startsAt: Date;
  timezone: string;
  bookingLinkTitle: string;
}) {
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: args.timezone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(args.startsAt);

  const message =
    `Booking canceled\n\n` +
    `Creator: ${args.creatorName}\n` +
    `Link: ${args.bookingLinkTitle}\n` +
    `Attendee: ${args.attendeeName}\n` +
    `Email: ${args.attendeeEmail}\n` +
    `Time: ${time} (${args.timezone})`;

  return sendTelegramMessage(message);
}

export async function sendBookingRescheduleTelegramMessage(args: {
  creatorName: string;
  attendeeName: string;
  attendeeEmail: string;
  oldStartsAt: Date;
  newStartsAt: Date;
  timezone: string;
  bookingLinkTitle: string;
}) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: args.timezone,
    dateStyle: "medium",
    timeStyle: "short",
  });

  const message =
    `Booking rescheduled\n\n` +
    `Creator: ${args.creatorName}\n` +
    `Link: ${args.bookingLinkTitle}\n` +
    `Attendee: ${args.attendeeName}\n` +
    `Email: ${args.attendeeEmail}\n` +
    `From: ${formatter.format(args.oldStartsAt)} (${args.timezone})\n` +
    `To: ${formatter.format(args.newStartsAt)} (${args.timezone})`;

  return sendTelegramMessage(message);
}
