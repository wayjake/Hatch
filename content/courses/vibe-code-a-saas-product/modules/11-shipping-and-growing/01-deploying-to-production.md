---
title: Deploying to Production
duration: 10 min
type: hands-on
---

# Deploying to Production

You've been deploying throughout this course — every tutorial project went live on Vercel. But deploying your actual SaaS product feels different. Let's make sure you do it right.

## The Pre-Deploy Checklist

Go through this before you share your URL with anyone:

### Environment Variables
- [ ] All keys are set in Vercel (Turso, Clerk, Resend, Stripe, etc.)
- [ ] You're using **production** keys, not test keys (except Stripe — start with test keys until you're ready)
- [ ] No secrets are hardcoded in your source code
- [ ] `.env` is in `.gitignore`

### Database
- [ ] Turso database is created and accessible
- [ ] Migrations have been run
- [ ] The connection works from Vercel (test by visiting a page that loads data)

### Authentication
- [ ] Clerk is configured with your production domain
- [ ] OAuth callback URLs point to your production URL (not localhost)
- [ ] Sign up, sign in, and sign out all work
- [ ] Protected routes redirect to login when not authenticated

### Functionality
- [ ] Your core feature works end-to-end
- [ ] Error states are handled (empty data, bad inputs, failed API calls)
- [ ] The marketing site loads correctly
- [ ] Mobile view doesn't break (test on your phone)

### Security
- [ ] All user data endpoints have authentication AND authorization checks
- [ ] Input validation is on every form
- [ ] HTTPS is working (Vercel does this automatically)

## Deploy

If you haven't already:

```bash
git add .
git commit -m "Prepare for production launch"
git push
```

Vercel deploys automatically. Visit your URL and go through the entire user flow:

1. Land on marketing page
2. Sign up
3. Use the core feature
4. Check that data persists
5. Sign out and sign back in
6. Verify data is still there

## Set Up Monitoring

Even a simple monitoring setup catches problems before your users report them:

**Error tracking:** Sign up for [Sentry](https://sentry.io) (free tier). Add their SDK:

```bash
npm install @sentry/react-router
```

Sentry captures JavaScript errors in production and sends you alerts. This is how you find out about bugs before your users email you about them.

**Uptime monitoring:** Use a free service like [UptimeRobot](https://uptimerobot.com) to ping your URL every 5 minutes. If your site goes down, you get a text or email immediately.

## Your Product Is Live

Take a breath. You built a SaaS product. It's on the internet. Real people can use it.

I remember the feeling when Dubsado first went live. It was terrifying and exhilarating. Every notification was either a thrill ("someone signed up!") or a panic ("something broke!"). That feeling is normal. It means you care about what you're building.

Commit this milestone:

```bash
git add .
git commit -m "Production deployment with monitoring"
git push
```

Next, let's set up your custom domain.
