---
title: The Tool Ecosystem
duration: 10 min
type: listen-along
---

# The Tool Ecosystem

Beyond the core stack, there's a set of tools and services that make the whole operation run smoothly. These are the things that handle the stuff you don't want to build yourself — and trust me, you don't want to build them yourself.

## Vercel — Hosting & Deployment

Vercel is where your application lives on the internet. What makes it special for us:

- **Connect your GitHub repo** and every time you push code, Vercel automatically deploys it
- **Preview deployments** — every branch gets its own URL so you can test before going live
- **Free tier** that's generous enough for development and early customers

When I started Dubsado, deploying was a whole ordeal. Today, it's `git push` and you're live. That's Vercel.

## Git & GitHub — Version Control

We covered git in the last module, but let me emphasize something: **GitHub is not optional.** It's where your code lives, how you collaborate (even if it's just with yourself), and how Vercel knows to deploy your changes.

Every project we build in this course will live on GitHub. You'll push **commits** every time you make progress. This creates a history you can always return to — and a backup that lives outside your computer.

## Cloudflare — Domains & DNS

When someone types `yoursaas.com` into their browser, **DNS** (Domain Name System) is what translates that human-readable name into the server address where your app lives. Think of it like a phone book for the internet.

Cloudflare manages your DNS and adds:

- **Speed** — it caches your content on servers worldwide
- **Security** — free SSL certificates (the padlock icon in the browser) and DDoS protection
- **Reliability** — your DNS is backed by one of the largest networks in the world

Setting up Cloudflare takes about 10 minutes. We'll do it together when we deploy.

## Turso — Database

Your database is where your users' data lives. When someone creates an account, fills out a form, or saves a setting — that data goes to your database.

Turso runs SQLite at the edge, which means:

- **Fast** — your database is close to your users, wherever they are
- **Simple** — SQLite is the most widely deployed database engine in the world
- **Affordable** — generous free tier, predictable pricing after that

We'll set up Turso during the Form Builder tutorial and use it for the rest of the course.

## Drizzle — Database Management

Drizzle is an ORM — an Object-Relational Mapper. That's a fancy way of saying "it lets you talk to your database using TypeScript instead of writing raw SQL."

Instead of:
```sql
SELECT * FROM users WHERE email = 'hello@example.com';
```

You write:
```typescript
const user = await db.select().from(users).where(eq(users.email, 'hello@example.com'));
```

Both do the same thing, but the TypeScript version catches mistakes at development time and integrates with the rest of your code.

## Why These Specific Tools?

Every tool I've chosen has three things in common:

1. **Generous free tier** — you can build and launch without spending money
2. **Excellent documentation** — which means AI generates great code for them
3. **Repeatable patterns** — once you learn the pattern, it's the same every time

These aren't the only options. But they're proven, they work well together, and they'll let you focus on building your product instead of fighting your tools.

Throughout this course, I'll keep connecting what we're doing back to these tools. By the end, you won't just know what they do — you'll have used every one of them.
