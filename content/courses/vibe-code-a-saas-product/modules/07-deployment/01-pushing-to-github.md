---
title: Pushing to GitHub
duration: 8 min
type: hands-on
---

# Pushing to GitHub

We've been committing code throughout the build sections, but everything has lived on your local machine. Now it's time to push your code to GitHub — making it safe, shareable, and ready for deployment.

## Why GitHub?

GitHub is where your code lives in the cloud. It's like UploadThing for files and Turso for data, but for your source code. If your laptop dies, your code is safe. If you want to deploy, hosting services like Vercel pull directly from GitHub.

## Create a Repository

1. Go to [github.com/new](https://github.com/new)
2. Name your repository (e.g., `image-upload-app`)
3. Keep it **private** (you can make it public later if you want)
4. **Don't** initialize with a README — we already have code

## Connect and Push

GitHub will show you instructions for an existing repository. Run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/image-upload-app.git
git push -u origin main
```

Refresh your GitHub page. Your code is there — every file, every commit, every branch we created during the builds.

## Review Your History

Click on the commit history in GitHub. You should see the story of our project:

1. Initial scaffold
2. Local image upload
3. UploadThing integration
4. Local SQLite with Drizzle
5. Move to Turso
6. DIY email + password auth
7. Replace with Clerk

Each commit tells a chapter of what we built. This is why committing regularly matters — it creates a timeline of your work that you (and anyone you collaborate with) can follow.

## Verify Your `.gitignore`

Check that sensitive files aren't in your repository:

- `.env` should **not** appear in your GitHub files
- `node_modules` should **not** appear
- Any local database files (`.db`) should **not** appear

If you see any of these, add them to `.gitignore`, commit, and push again. This is a common mistake — and with secrets like API keys, it's a serious one.

## Your Code Is Safe

From now on, every time you `git push`, your latest code is backed up to GitHub. Vercel will watch this repository and deploy automatically whenever you push to `main`.

Let's set that up next.
