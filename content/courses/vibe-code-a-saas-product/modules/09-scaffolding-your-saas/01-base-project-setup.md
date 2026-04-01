---
title: Base Project Setup
duration: 12 min
type: hands-on
---

# Base Project Setup

This is it. You're scaffolding your actual SaaS product. Not a tutorial. Not a practice app. The real thing.

## Scaffold

```bash
npx create-react-router@latest my-saas-name --yes
cd my-saas-name
```

Replace `my-saas-name` with your actual product name (lowercase, hyphens for spaces).

## First Commit

```bash
git add .
git commit -m "Initial scaffold"
```

Create a GitHub repo for it and push:

```bash
git remote add origin git@github.com:YOUR_USERNAME/my-saas-name.git
git push -u origin main
```

## Project Structure

Let's set up a clean structure from the start. Ask your AI:

"Set up the following project structure:
- `app/routes/` — page routes (we'll add these as we go)
- `app/components/` — shared UI components
- `app/lib/` — utility functions and server-side logic
- `app/db/` — database schema and connection (Drizzle + Turso)
- Clean up the boilerplate. Remove the default welcome page. Set up a minimal home page that just shows the product name."

## Install Core Dependencies

```bash
npm install drizzle-orm @libsql/client @clerk/react-router
npm install -D drizzle-kit
```

These are the same tools we've been using throughout the course:

- **Drizzle + libsql** for your Turso database
- **Clerk** for authentication

## Environment Variables

Create your `.env` file with placeholders:

```bash
# Database (Turso)
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=

# Auth (Clerk)
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# App
APP_URL=http://localhost:5173
```

We'll fill these in as we set up each service. Verify `.env` is in `.gitignore`.

## Set Up Turso

You know the drill:

```bash
turso db create my-saas-name
turso db show my-saas-name --url
turso db tokens create my-saas-name
```

Add the URL and token to your `.env`.

## Define Your Initial Schema

Based on your user stories, ask the AI to create a basic schema. Keep it minimal — only the tables you need for your MVP.

"Create a Drizzle schema for [describe your core entity]. I need a users table and a [your main entity] table. Keep it minimal — we'll add more fields as we build features."

Generate and run the migration:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

## Commit

```bash
git add .
git commit -m "Add project structure, Turso database, and initial schema"
git push
```

## Deploy Early

Set up Vercel now. Import the project, add your environment variables. Even though there's nothing to show yet, getting deployment working early means:

1. You catch deployment issues immediately, not after a week of building
2. You get preview deployments for every branch
3. You have a live URL to show people

Remember: **deploying early and often** is one of the best habits I picked up from building Dubsado. The longer you wait, the more surprises you get.

Your product has a home. Let's give it an identity.
