---
title: Production Secrets
duration: 8 min
type: hands-on
---

# Production Secrets

When you deployed your practice app earlier, you added environment variables to Vercel. Now you're doing the same for your SaaS product — but the stakes are higher because these are production keys handling real user data.

## Staging vs Production Keys

Many services provide separate keys for different environments:

- **Stripe:** `sk_test_...` for development, `sk_live_...` for production
- **Clerk:** Separate applications for development and production
- **Turso:** You can create separate databases for staging and production

Never use test keys in production or production keys in development. Test keys often have relaxed security, and production keys connected to your local machine is an accident waiting for a place to happen.

## Setting Up Vercel Environment Variables

In your Vercel project settings, you can scope each variable to specific environments:

- **Production** — used when deploying from `main`
- **Preview** — used for branch deployments (your staging environment)
- **Development** — used with `vercel dev` locally

Set your production keys for Production only, and your test keys for Preview and Development. This ensures your local development and branch previews never touch real user data.

## The Full List

Walk through each service your SaaS uses and add the production keys:

1. **Database** (Turso) — production database URL and auth token
2. **Authentication** (Clerk) — production publishable and secret keys
3. **File storage** (UploadThing) — production token
4. **Email** (Resend, Postmark, etc.) — production API key
5. **Payments** (Stripe) — live secret key and webhook signing secret
6. **Any other integrations** — check your `.env` file for the full list

## Verify Before You Launch

After adding all production secrets:

1. Trigger a production deployment
2. Test the complete user flow with a real account
3. Check that emails send from your real domain (not a sandbox)
4. If using Stripe, do a real small-amount charge and refund it
5. Verify file uploads work and persist

Your secrets are the bridge between your code and the services that power your product. Get them right, and everything works. Miss one, and your users hit a wall.
