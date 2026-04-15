---
title: Deploying to Vercel
duration: 10 min
type: hands-on
---

# Deploying to Vercel

Your code is on GitHub. Now let's put your app on the internet.

## What Is Vercel?

Vercel is a hosting platform built for frontend frameworks like React Router. It takes your code from GitHub, builds it, and serves it to the world — with HTTPS, a CDN, and automatic deployments every time you push code.

## Connect Your Repository

1. Sign up at [vercel.com](https://vercel.com) (free tier is plenty to start)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel detects React Router automatically — the build settings should be pre-filled
5. **Don't deploy yet** — we need to add environment variables first

## Why Not Deploy Yet?

Our app depends on three external services:

- **UploadThing** — for file storage
- **Turso** — for the database
- **Clerk** — for authentication

Each one needs API keys. Without them, the app will crash on startup. Let's add them in the next lesson before we hit deploy.
