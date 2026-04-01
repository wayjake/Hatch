---
title: Mapping Data Between Services
duration: 8 min
type: listen-along
---

# Mapping Data Between Services

When you integrate external services, you inevitably face the question: how does data from Service A map to data in your application?

## The Problem

Every service has its own data model. Stripe calls people "customers." Clerk calls them "users." Mailchimp calls them "contacts." Your database probably calls them something else.

A person who signs up for your app exists in:

- **Your database** — with your internal user ID
- **Clerk** — with a Clerk user ID
- **Stripe** — with a Stripe customer ID
- **Mailchimp** — with a subscriber hash
- **Your email provider** — with whatever ID they use

You need to connect these identities so when something happens in one system (payment in Stripe), you can take action in another (update the user's plan in your database).

## The Mapping Table

The simplest approach: store external IDs on your user record.

```typescript
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  clerkId: text("clerk_id").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id").unique(),
  // ...
});
```

When Stripe sends a webhook event, it includes the Stripe customer ID. You look up the user by `stripeCustomerId` and update their record.

## Webhook Event Mapping

This is where it gets real. A typical flow:

1. **Stripe sends webhook:** "Customer `cus_abc` paid invoice"
2. **Your handler:** Look up user where `stripeCustomerId = 'cus_abc'`
3. **Your handler:** Update that user's plan to "pro"
4. **Your handler:** Trigger a welcome-to-pro email via Resend
5. **Your handler:** Update their Mailchimp tags to "paying customer"

One event in one system triggers actions across multiple systems. This is the plumbing of a real SaaS product.

## Keeping Data in Sync

Data gets out of sync. It's inevitable. A webhook fails. An API call times out. A user changes their email in one system but not another.

Strategies:

- **Use webhooks** for real-time sync where available
- **Don't duplicate data** unnecessarily — fetch from the source of truth when you can
- **Idempotent handlers** — if you receive the same webhook twice, the result should be the same (don't double-charge, don't double-email)
- **Log everything** — when something goes wrong, logs are how you figure out what happened

## The Dubsado Experience

At Dubsado, data mapping was one of the most complex parts of the system. Users connected their payment processors, their email tools, their calendars. Each integration had its own data model, its own quirks, its own failure modes.

The lesson: **start with fewer integrations done well.** One solid integration beats five flaky ones. You can always add more, but you can't un-frustrate a user who lost data because your Mailchimp sync failed silently.

## For Your MVP

For your initial launch, you probably need:

1. **Clerk → Your database** — map Clerk user IDs to your internal user records
2. **Stripe → Your database** — map Stripe customer IDs for billing
3. Maybe one more integration specific to your product

That's enough. Each additional integration adds complexity and maintenance burden. Add them when users ask for them, not when you think they might be useful.
