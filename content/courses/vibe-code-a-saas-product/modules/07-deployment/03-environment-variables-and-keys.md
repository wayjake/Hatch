---
title: Environment Variables and Keys
duration: 10 min
type: hands-on
---

# Environment Variables and Keys

Your app needs secrets to talk to external services. Locally, these live in your `.env` file. In production, they live in Vercel's environment settings. Let's set them up.

## Understanding Your Keys

Throughout the builds, we've collected several keys:

| Service | Variable | Type | Purpose |
|---------|----------|------|---------|
| UploadThing | `UPLOADTHING_TOKEN` | Private | Authenticates file uploads |
| Turso | `TURSO_DATABASE_URL` | Private | Database connection URL |
| Turso | `TURSO_AUTH_TOKEN` | Private | Database authentication |
| Clerk | `CLERK_SECRET_KEY` | Private | Server-side session verification |
| Clerk | `CLERK_PUBLISHABLE_KEY` | Public | Client-side app identification |

**Private keys** are secrets — they grant access to your services. If someone gets your Turso auth token, they can read and write your database. If someone gets your Clerk secret key, they can impersonate users.

**Public keys** identify your app but don't grant access on their own. Clerk's publishable key tells their SDK which app the user is logging into — it's safe to expose in browser code.

## Add Keys to Vercel

In your Vercel project dashboard:

1. Go to **Settings → Environment Variables**
2. Add each key from the table above
3. For each one, select which environments it applies to (Production, Preview, Development)
4. Double-check that you're using the right values — not your local test keys if the service provides separate production keys

## Key Rotation

Keys can be compromised — accidentally committed to git, shared in a screenshot, or leaked through a vulnerability. When that happens, you need to **rotate** the key:

1. Generate a new key in the service's dashboard
2. Update it in your `.env` file locally
3. Update it in Vercel's environment variables
4. Redeploy your application
5. Verify everything works
6. Revoke the old key

**Always update everywhere before revoking the old key.** If you revoke first, your app breaks until the new key is in place.

## Deploy

Now that your keys are configured:

1. Go back to your Vercel project
2. Click **Deploy** (or trigger a redeployment)
3. Watch the build logs — if a key is missing, you'll see an error here
4. Once deployed, visit your URL and test the full flow:
   - Sign up / log in (Clerk)
   - Upload an image (UploadThing)
   - Verify it appears in the grid (Turso)

If something fails, check the Vercel function logs — they'll tell you which service couldn't connect.

## Your App Is Live

Your image upload app is on the internet. Real people can sign up, log in, and upload images. The files go to UploadThing, the data goes to Turso, and authentication goes through Clerk.

This is the same architecture you'll use for your SaaS product. The services might change, but the pattern is the same: code on GitHub, secrets in Vercel, services connected through API keys.
