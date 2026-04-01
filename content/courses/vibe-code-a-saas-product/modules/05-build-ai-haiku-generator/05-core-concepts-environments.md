---
title: "Core Concepts: Dev vs Staging vs Production"
duration: 7 min
type: listen-along
---

# Core Concepts: Dev vs Staging vs Production

We've now deployed two projects. Each time, your app existed in two places: your laptop and Vercel. Let's formalize this, because understanding environments is crucial for running a real SaaS.

## Development (Dev)

Your **development environment** is your laptop. It's where you write code, test ideas, and break things without consequences.

When you run `npm run dev`, you're running in development mode. Things load differently:

- Error messages are detailed and helpful
- Changes show up instantly (hot reload)
- Your `.env` file provides local secrets
- Nobody else can see what you're doing

This is your sandbox. Experiment freely.

## Production (Prod)

Your **production environment** is the live version — the one real users interact with. On Vercel, this is the deployment tied to your `main` branch.

In production:

- Error messages are generic (you don't want users seeing stack traces)
- Code is optimized and compressed for speed
- Environment variables come from your hosting platform, not `.env`
- Everything you do affects real people

When I was running Dubsado, a production bug at 2 AM meant real businesses couldn't send invoices. The stakes are different. That's why you never push untested code directly to production.

## Staging

**Staging** is the middle ground — a production-like environment where you test things before they go live. It uses the same hosting setup, the same database structure, but with test data.

You might not need staging on day one. But as your product grows and has real users, you'll want a place to test changes without risking the live version.

Vercel gives you this for free with **preview deployments**. Every time you push a branch that isn't `main`, Vercel creates a temporary deployment at a unique URL. That's basically a staging environment.

## Environment Variables Across Environments

This is where it gets practical. You'll often have different values for different environments:

| Variable | Dev | Staging | Production |
|----------|-----|---------|------------|
| `DATABASE_URL` | Local database | Test database | Real database |
| `STRIPE_SECRET_KEY` | Test key (sk_test_...) | Test key | Live key (sk_live_...) |
| `APP_URL` | localhost:5173 | staging.yourapp.com | yourapp.com |

Notice Stripe gives you separate test and live keys. Most services do this. Your development environment should never touch real payment data.

## The Flow

The healthy workflow:

1. Build and test in **dev** (your laptop)
2. **Commit** and **push** to a branch
3. Review the Vercel preview deployment (**staging**)
4. Merge to `main`
5. Vercel auto-deploys to **production**

This flow protects your users. Code goes through two checkpoints (your review and the preview deployment) before it reaches production.

We'll refer back to these environment concepts when we set up databases, authentication, and payment processing. Each one requires careful environment configuration. For now, the key takeaway: **dev is for you, staging is for testing, production is for your users.**
