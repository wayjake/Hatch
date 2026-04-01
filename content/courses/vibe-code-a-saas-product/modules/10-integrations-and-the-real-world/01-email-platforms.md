---
title: Integrating Email Platforms
duration: 10 min
type: hands-on
---

# Integrating Email Platforms

Almost every SaaS product sends email. Welcome emails, notifications, receipts, password resets (though Clerk handles that one for us). At some point, you'll want to connect to an email platform.

## The Options

| Service | Best For | Why |
|---------|----------|-----|
| **Resend** | Transactional email | Modern API, great DX, React Email templates |
| **Mailchimp** | Marketing emails & newsletters | Industry standard, huge feature set |
| **SendGrid** | High volume transactional | Reliable, scalable |
| **ConvertKit** | Creator newsletters | Built for creators, good automation |

For your SaaS, you'll likely need two types of email:

1. **Transactional** — triggered by user actions (welcome email, invoice sent, form submitted). Use Resend or SendGrid.
2. **Marketing** — newsletters, announcements, campaigns. Use Mailchimp or ConvertKit.

## Example: Connecting Resend

Let's wire up transactional email with Resend as an example. The pattern is identical for any email API.

```bash
npm install resend
```

Add your key to `.env`:

```bash
RESEND_API_KEY=re_...
```

Ask your AI:

"Create an email utility at `app/lib/email.server.ts` using Resend. Include:
1. A configured Resend client
2. A `sendWelcomeEmail` function that takes an email address and name
3. A `sendNotificationEmail` function that takes an email, subject, and body text
4. Error handling that logs failures but doesn't crash the app"

The generated code should look something like:

```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(email: string, name: string) {
  await resend.emails.send({
    from: "Your App <hello@yourapp.com>",
    to: email,
    subject: "Welcome to Your App!",
    text: `Hi ${name}, welcome aboard!`,
  });
}
```

## Example: Connecting Mailchimp

For marketing emails, you'd connect Mailchimp's API to add users to a mailing list when they sign up:

```bash
npm install @mailchimp/mailchimp_marketing
```

```typescript
import mailchimp from "@mailchimp/mailchimp_marketing";

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX, // e.g., "us21"
});

export async function addToMailingList(email: string, name: string) {
  await mailchimp.lists.addListMember(process.env.MAILCHIMP_LIST_ID!, {
    email_address: email,
    status: "subscribed",
    merge_fields: { FNAME: name },
  });
}
```

## The Pattern

Notice it's the same pattern every time:

1. Install the library
2. Add the API key to `.env`
3. Create a server-side utility with typed functions
4. Call those functions from your actions and loaders

This is the same pattern we followed with UploadThing, with the AI API, with Turso. Once you internalize it, integrating any new service becomes routine.

## When to Send Email

Be thoughtful about email. Every email you send is asking for your user's attention. Rules of thumb:

- **Welcome email** — yes, always
- **Action confirmations** — only for important actions (payment received, account changes)
- **Notifications** — let users control these in settings
- **Marketing** — only with explicit consent (and always with an unsubscribe link)

At Dubsado, we were careful about email volume. Our users were busy running businesses — the last thing they needed was spam from their project management tool.

## Commit

```bash
git add .
git commit -m "Add email integration"
git push
```
