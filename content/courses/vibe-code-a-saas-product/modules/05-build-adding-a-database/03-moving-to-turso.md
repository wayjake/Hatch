---
title: Moving to Turso
duration: 12 min
type: hands-on
---

# Moving to Turso

Your local SQLite database works perfectly on your machine. But when you deploy your app, that file doesn't come with you. We need a database that lives in the cloud — and Turso makes this transition remarkably smooth because it speaks SQLite.

## What Is Turso?

**Turso** is a hosted SQLite database service. It runs your SQLite database on their servers, accessible over the internet. The best part: because it's still SQLite under the hood, almost nothing in your code changes.

This is the same pattern from the image upload module — local first, cloud second. Your schema stays the same, your queries stay the same. Only the connection changes.

## Create a Turso Account

1. Sign up at [turso.tech](https://turso.tech) (free tier is generous)
2. Install the Turso CLI:

```bash
brew install tursodatabase/tap/turso  # macOS
turso auth login
```

3. Create a database:

```bash
turso db create image-upload-app
```

4. Get your connection details:

```bash
turso db show image-upload-app --url
turso db tokens create image-upload-app
```

Add these to your `.env`:

```bash
TURSO_DATABASE_URL=libsql://your-database-url
TURSO_AUTH_TOKEN=your-auth-token
```

## Update the Connection

Open Claude Code:

"I'm switching my local SQLite database to Turso. I need to:
1. Replace better-sqlite3 with @libsql/client
2. Update my database connection file to use TURSO_DATABASE_URL and TURSO_AUTH_TOKEN from environment variables
3. Keep my existing Drizzle schema and queries exactly the same
4. Update drizzle config for Turso"

Review the changes — it should mostly be the connection file. Your schema and route code should be nearly identical.

## Push Your Schema

```bash
npx drizzle-kit push
```

This creates your tables on the Turso database. Verify in Drizzle Studio:

```bash
npx drizzle-kit studio
```

## Test It

Upload an image. Check Drizzle Studio — the data is now in Turso, not a local file. You can close your laptop, open it tomorrow, and the data is still there. You could access it from a completely different computer.

That's the power of a cloud database. Your data lives independently from your machine.

## What Changed?

Almost nothing in your actual application code. The schema is the same. The queries are the same. The only thing that changed is where the database lives — from a file on your disk to a server in the cloud.

This is a pattern you'll see over and over: **develop locally, deploy to the cloud**. It keeps development fast and simple while making your app ready for the real world.

## Commit

```bash
git add .
git commit -m "Move database from local SQLite to Turso"
```
