---
title: Connecting UploadThing
duration: 15 min
type: hands-on
---

# Connecting UploadThing

Now we're going to connect our app to a real external service. This is your first taste of working with an **API** — a concept we'll define formally at the end of this module.

## Create an UploadThing Account

Head to [uploadthing.com](https://uploadthing.com) and sign up. Create a new app in their dashboard. You'll get two values:

- `UPLOADTHING_TOKEN` — your secret key

Copy it and create a `.env` file in your project root:

```bash
UPLOADTHING_TOKEN=your_token_here
```

**Important:** This file contains a secret. Never share it, never commit it to git. Check that `.env` is in your `.gitignore` file. If it's not, add it:

```
# .gitignore
.env
```

This is your first encounter with **private keys** — secrets that authenticate your app with external services. We'll talk a lot more about key management in the security module.

## Install the Package

```bash
npm install uploadthing @uploadthing/react
```

## Vibe Code the Integration

Here's where it gets fun. Open Claude Code and give it context:

"I'm building an image upload app with React Router v7 and UploadThing. I need:
1. A server-side file router that accepts image uploads up to 4MB
2. A home page with a drag-and-drop upload zone and an image grid showing uploaded files
3. The ability to delete uploaded images
4. Use Tailwind for styling, keep it clean and minimal"

Let the AI generate the code. Review each file:

- Does the file router look reasonable? It should define what file types and sizes are accepted.
- Does the upload component handle loading and error states?
- Does the image grid display actual uploaded images?

This is the review step. Don't just accept blindly — read through it, understand the structure, and make sure it makes sense. If something looks off, ask the AI to explain it or fix it.

## Test It

```bash
npm run dev
```

Try uploading an image. You should see it appear in the grid. Try uploading something too large — you should get an error message.

If something doesn't work, paste the error message into Claude Code. "I'm getting this error when I try to upload: [paste error]." AI is excellent at debugging from error messages.

## Commit Your Progress

```bash
git add .
git commit -m "Add image upload with UploadThing integration"
git push
```

Notice we're pushing after every major milestone. Your code is safe on GitHub.

## What Just Happened

You just integrated an external service into your app. Your code talks to UploadThing's servers, sends files, and receives URLs back. This is the same pattern you'll use for every external service — Stripe for payments, Clerk for authentication, AI APIs for generation.

The pattern is always:

1. Sign up for the service
2. Get your API keys
3. Store them securely in `.env`
4. Install their library
5. Wire it into your app

Every integration follows this pattern. Once you've done it once, you've done it a hundred times.
