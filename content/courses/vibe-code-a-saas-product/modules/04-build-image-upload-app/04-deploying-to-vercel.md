---
title: Deploying to Vercel
duration: 10 min
type: hands-on
---

# Deploying to Vercel

Your app works locally. Let's put it on the internet.

## Why This Matters

Here's something I wish someone had told me when I was starting out: **deploying early is one of the best things you can do.**

When I was building Dubsado, I waited too long to deploy. I built locally for weeks, and when I finally deployed, a dozen things broke that I hadn't anticipated. The earlier you deploy, the fewer surprises you get.

With our setup, deploying is nearly effortless. Let's do it.

## Create a Vercel Account

Go to [vercel.com](https://vercel.com) and sign up with your GitHub account. This connection is important — it's how Vercel finds your code.

## Import Your Project

In the Vercel dashboard:

1. Click "Add New" → "Project"
2. Find your `image-uploader` repository in the list
3. Click "Import"

Vercel auto-detects that it's a React Router project and configures the build settings for you.

## Add Environment Variables

Before you deploy, you need to add your UploadThing secret. In the Vercel project settings:

1. Go to "Settings" → "Environment Variables"
2. Add `UPLOADTHING_TOKEN` with your token value

These are the same values from your `.env` file, but now they live on the server. Your `.env` file stays local and private. Vercel's environment variables are what the deployed version uses.

This is the distinction between your **development environment** (your laptop) and your **production environment** (Vercel). Same code, different configurations.

## Deploy

Click "Deploy." Vercel will:

1. Pull your code from GitHub
2. Install your dependencies
3. Build your project
4. Put it live at a URL like `image-uploader-abc123.vercel.app`

This takes about 60 seconds. When it's done, click the URL. Your app is live. On the actual internet. Anyone with the link can use it.

## The Magic: Auto-Deploy

Here's the really good part. From now on, every time you **push** a commit to GitHub, Vercel automatically redeploys your app. You don't have to do anything.

```bash
# Make a change...
git add .
git commit -m "Update upload grid layout"
git push
```

Within a minute, your live site reflects the change. This is the modern development workflow, and it's remarkable compared to what deployment used to be.

## Your First Deployment

Take a moment. You just deployed a real web application. It has a URL. It accepts file uploads. It stores images in the cloud. It works on any device with a browser.

This is what **hosting** and **deploying** look like in practice — the concepts we talked about in Module 1. They're not abstract anymore.

Commit this moment to memory. The next time someone asks you "but can you actually build stuff?" — you can send them a link.
