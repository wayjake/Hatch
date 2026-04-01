---
title: Public Keys, Private Keys, and Rotation
duration: 7 min
type: listen-along
---

# Public Keys, Private Keys, and Rotation

Throughout this course, we've been putting secret values in `.env` files and adding API keys to Vercel. Let's formalize what these are and how to manage them.

## Private Keys (Secrets)

A **private key** (also called a secret key) is a value that only your application should know. It authenticates your app with external services.

Examples we've already used:

- `ANTHROPIC_API_KEY` — lets your app call the Claude API
- `UPLOADTHING_TOKEN` — lets your app upload files to UploadThing
- `TURSO_AUTH_TOKEN` — lets your app read and write to your database
- `CLERK_SECRET_KEY` — lets your server verify user sessions

If someone gets your private key, they can:

- Make API calls as you (running up your bill)
- Read and modify your database
- Impersonate your application

**Private keys should never:**
- Be committed to git
- Be included in client-side (browser) code
- Be shared over email, Slack, or text
- Be hardcoded in your source files

They should **only** exist in:
- Your local `.env` file (which is in `.gitignore`)
- Your hosting platform's environment variables (Vercel, Railway, etc.)

## Public Keys

A **public key** is a value that can safely be exposed in the browser. It identifies your app but doesn't grant access on its own.

Example: `CLERK_PUBLISHABLE_KEY`. This goes in your frontend code and tells Clerk which app the user is logging into. It's not a secret — it's more like an address.

The naming convention usually helps: keys with "secret" or "private" in the name are private. Keys with "public" or "publishable" in the name are public.

## Key Rotation

**Rotation** means replacing an old key with a new one. You should rotate keys when:

- A key may have been exposed (committed to git, shared accidentally)
- A team member who had access leaves
- A security breach is suspected
- Periodically, as a preventive measure

Here's how to rotate a key:

1. Generate a new key in the service's dashboard (Stripe, Clerk, Turso, etc.)
2. Update the key in your `.env` file locally
3. Update the key in Vercel's environment variables
4. Redeploy your application
5. Verify everything works with the new key
6. Revoke the old key in the service's dashboard

**Important: update everywhere before revoking the old key.** If you revoke first, your application breaks until you add the new key.

## What to Do If a Key Is Exposed

Don't panic, but act fast:

1. **Rotate immediately** — generate a new key, update everywhere
2. **Check usage** — look at the service's dashboard for unusual activity
3. **Clean git history** — if the key was committed, it's in your git history even if you delete it. Use a tool like `git-filter-repo` or `BFG Repo Cleaner` to scrub it, or consider the key permanently compromised and just rotate
4. **Learn from it** — add better `.gitignore` rules, set up pre-commit hooks that scan for secrets

I've seen this happen to experienced developers. It's not a matter of if, but when. Having a rotation plan means it's a 10-minute fix instead of a crisis.

## The Summary

- **Private keys** are secrets. Protect them like passwords.
- **Public keys** identify your app. They can be in browser code.
- **Rotate** keys when they might be compromised, or periodically.
- **Never commit secrets to git.** Make this a non-negotiable habit.
