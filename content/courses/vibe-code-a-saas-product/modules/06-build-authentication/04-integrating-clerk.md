---
title: Integrating Clerk
duration: 15 min
type: hands-on
---

# Integrating Clerk

Time to swap out our hand-built auth for Clerk. You'll be surprised how much code we get to delete.

## Create a Clerk Account

1. Sign up at [clerk.com](https://clerk.com) (free tier handles thousands of users)
2. Create a new application
3. You'll get two keys:
   - `CLERK_PUBLISHABLE_KEY` — safe for the browser (identifies your app)
   - `CLERK_SECRET_KEY` — server-only (verifies sessions)

Add them to your `.env`:

```bash
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

## Vibe Code the Swap

Open Claude Code:

"I'm replacing my hand-built email + password authentication with Clerk in my React Router v7 app. I need to:
1. Install @clerk/react-router
2. Remove my old auth routes (signup, login, logout), session utilities, and password hashing code
3. Remove the passwordHash column from the users table (Clerk manages credentials)
4. Add Clerk's middleware for session verification
5. Replace my `requireUser` utility with Clerk's auth helpers
6. Add Clerk's SignIn and SignUp components to my app
7. Keep my existing authorization logic (users only see their own images) but use Clerk's userId instead of my old session"

This is the fun part. Watch how much code gets deleted.

## Review the Diff

Look at what changed:

- **Deleted:** Your signup page, login page, logout action, password hashing, session cookie management, CSRF tokens
- **Added:** A few lines of Clerk configuration and middleware
- **Changed:** `requireUser` now calls Clerk instead of reading a cookie

All those things we talked about in the last lesson — password resets, email verification, brute force protection, social login — you get them all, for free, without writing a single line of code.

## Test It

1. Start your dev server
2. Try the sign-up flow — Clerk provides a polished UI out of the box
3. Log in, upload an image, verify it's tied to your account
4. Log out and sign up with a different email — verify separate image libraries
5. Try the "Forgot Password" flow — it works, and you didn't build it

## What Clerk Gives You

Open the Clerk dashboard. You can see:

- All your users and their activity
- Session history
- Security settings (enable MFA, require email verification)
- Customization options for the login UI

This is the difference between building auth yourself and using a managed service. You went from hundreds of lines of security-critical code to a dashboard where you flip switches.

## Commit and Merge

```bash
git add .
git commit -m "Replace DIY auth with Clerk"
```

We've completed all three builds. Our app now has file uploads (UploadThing), a database (Turso), and authentication (Clerk). Before we move on to deployment, let's merge this branch:

```bash
git checkout main
git merge build/authentication
```

Main now has the complete application.
