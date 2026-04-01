---
title: Authentication with Clerk
duration: 15 min
type: hands-on
---

# Authentication with Clerk

Let's add login to your application. This is the part where a lot of founders go wrong — they try to build auth themselves. Don't.

## Why Managed Authentication

Let me be blunt: **you should not build authentication from scratch.** Not for your first product. Probably not ever.

Here's what "build it yourself" means:

- Securely hashing and storing passwords
- Email verification flows
- Password reset flows
- Session management
- Brute force protection
- Two-factor authentication
- OAuth integration (Google, GitHub, etc.)
- CSRF protection
- Token rotation

Each of these is an opportunity for a security vulnerability. Each one has been exploited in production applications built by experienced teams.

At Dubsado, authentication was some of the most sensitive code in the entire system. If I were starting today, I would use Clerk from day one and never look back.

Clerk handles all of the above for you. You get secure, battle-tested authentication with a few lines of code and a generous free tier.

## Set Up Clerk

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Choose your sign-in options (email + password, Google, etc.)
4. Copy your API keys to `.env`:

```bash
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

Note the naming: the **publishable key** is a public key (safe for the browser). The **secret key** is a private key (server only).

## Install and Configure

The `@clerk/react-router` package we installed earlier provides everything you need. Ask your AI:

"Set up Clerk authentication in this React Router v7 app. I need:
1. The Clerk provider wrapping the app in root.tsx
2. Sign-in and sign-up pages at /login and /signup
3. A middleware/utility that protects routes and makes the user available in loaders
4. A user button component in the app header showing the user's avatar with sign-out"

## Protect Your Routes

This is the critical piece. Any route that should require login needs an authentication check:

```typescript
import { requireUser } from "~/lib/auth.server";

export async function loader({ request }: LoaderArgs) {
  const user = await requireUser(request);
  // If we get here, the user is authenticated
  // If not, requireUser redirected to /login
  return { user };
}
```

Every loader, every action that deals with user data needs this check. Remind the AI of this when you build new features: "Make sure this route requires authentication."

## Test the Full Flow

1. Start your dev server: `npm run dev`
2. Visit a protected route — you should be redirected to `/login`
3. Sign up for a new account
4. After sign-up, you should be redirected to the protected route
5. Refresh — you should still be logged in
6. Click the user button — sign out
7. Try to visit the protected route again — redirected to login

If all seven steps work, your auth is solid.

## Commit

```bash
git add .
git commit -m "Add Clerk authentication with protected routes"
git push
```

Update your Vercel environment variables with the Clerk keys. Check that login works on the deployed version too.

## What About Authorization?

Authentication is done — Clerk tells you *who* the user is. Authorization — *what they can do* — is on you. We covered this in the security module.

As you build features, always ask: "Can this user access this specific data?" Authentication is the foundation. Authorization is the walls. You need both.
