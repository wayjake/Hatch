---
title: Why Not DIY Auth?
duration: 10 min
type: listen-along
---

# Why Not DIY Auth?

You just built authentication from scratch. It works. So why would you ever pay for a service to do it for you?

Because what we built is the happy path. Real-world authentication is an iceberg — what you see above the water is login and signup. What's below the surface can sink your product.

## What We Didn't Build

Here's what a production-ready auth system actually needs:

- **Password reset flow** — emails, tokens, expiration, rate limiting
- **Email verification** — proving the user owns the email address
- **Brute force protection** — locking accounts after too many failed attempts
- **Session management** — expiring sessions, invalidating tokens across devices
- **Multi-factor authentication** — TOTP codes, SMS verification, backup codes
- **Social login** — Google, GitHub, Apple — each with their own OAuth flow
- **CSRF protection** — preventing cross-site request forgery attacks
- **Account recovery** — what happens when someone loses access?
- **Password strength requirements** — enforcing minimum complexity
- **Audit logging** — tracking who logged in, when, and from where

That's not a nice-to-have list. That's a "your users will get hacked without this" list.

## Authentication vs Authorization

This is a critical distinction. **Authentication** asks "who are you?" — it's the login. **Authorization** asks "what can you do?" — it's the permissions.

Our app checks if you're logged in (authentication) and shows you only your images (authorization). But think about what happens as your app grows:

- Admin users who can see everyone's uploads
- Free-tier users limited to 10 images, pro users unlimited
- Shared albums where specific users have access

Authorization logic is specific to your app — no service can build it for you. But authentication? The "who are you" part? That's the same for every app. And it's the part that's hardest to get right.

## What Users Trust You With

When someone creates an account on your app, they're handing you their email and trusting you with their password. That's a real responsibility.

At Dubsado, our users stored client contracts, invoices, and business workflows. If our authentication had a vulnerability, a photographer's client list could be exposed. That's not just a bug — it's a trust-destroying, potentially lawsuit-generating incident.

You don't need to be a security expert. But you need to:

1. **Use managed services** for the hard stuff (Clerk for auth, Stripe for payments)
2. **Follow the patterns** we've covered (input validation, authorization checks)
3. **Never store what you don't need.** The safest data is data you never collected.
4. **Be honest when things go wrong.** Transparency builds more trust than perfection.

## Enter Clerk

This is exactly why services like **Clerk** exist. They handle the entire authentication iceberg:

- Login, signup, password reset, email verification
- Social login (Google, GitHub, etc.)
- Multi-factor authentication
- Session management and security
- Beautiful, customizable UI components
- Compliance with security standards

You focus on your product. They focus on not getting your users hacked.

In the next lesson, we'll rip out our DIY auth and replace it with Clerk. You'll see how much simpler it is — and now you'll actually understand what it's doing for you.

## The Decision Framework

Here's when to build auth yourself vs. use a service:

**Build it yourself if:**
- You're learning (which is what we just did)
- You have very specific requirements no service supports
- You're a security team with dedicated resources

**Use a managed service if:**
- You're building a product (not just learning)
- You want to ship faster
- You don't have a dedicated security team
- You'd rather spend your time on features that make your product unique

For almost every indie founder and small team, the answer is: use a managed service.
