---
title: Uploading to Your Machine
duration: 12 min
type: hands-on
---

# Uploading to Your Machine

Before we connect to any external service, let's start with the simplest possible version of file uploading: saving files directly to your machine.

## Why Start Local?

It's tempting to jump straight to a cloud service. But starting local teaches you what's actually happening when a file gets uploaded. There's no magic — it's data moving from the browser to your server, and your server writing it to disk.

Understanding this makes everything that comes after (cloud storage, CDNs, signed URLs) less mysterious.

## Vibe Code It

Open Claude Code and give it context:

"I'm building an image upload app with React Router v7. I need:
1. A route action that accepts file uploads from a form
2. Save uploaded files to a `public/uploads` folder on my machine
3. A home page with a simple upload form and an image grid showing the uploaded files
4. The ability to delete uploaded images
5. Use Tailwind for styling, keep it clean and minimal"

Let the AI generate the code. Review each file:

- Does the action handler read the file from the form data?
- Does it write the file to the correct directory?
- Does the loader read existing files from that directory?

## Test It

```bash
npm run dev
```

Upload an image. Now go look at your `public/uploads` folder in your file explorer or terminal:

```bash
ls public/uploads
```

There it is — a real file, sitting on your machine. Open it. It's the image you just uploaded.

This is what's happening under the hood with every file upload on the internet. Data goes from the user's browser to a server, and the server stores it somewhere. Right now, "somewhere" is your laptop.

## The Problem

This works great for development. But think about what happens when you want to share this app with the world:

- Your uploaded files live on **your machine**. No one else can access them.
- If you deploy this to a hosting service like Vercel, the server's file system is **temporary** — files disappear between deployments.
- If your hard drive fails, your files are gone. There's no backup.

This is exactly why services like UploadThing, AWS S3, and Cloudflare R2 exist. They store your files on cloud infrastructure that's reliable, fast, and accessible from anywhere.

In the next lesson, we'll swap out local storage for UploadThing — and you'll see the difference firsthand.

## Commit Your Progress

```bash
git add .
git commit -m "Add local image upload"
```

Notice we're committing on our `build/image-upload` branch. Main stays clean.
