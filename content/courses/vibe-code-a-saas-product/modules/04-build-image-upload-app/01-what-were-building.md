---
title: "What We're Building"
duration: 5 min
type: listen-along
---

# What We're Building

Our first project is an image upload app. Simple on the surface, but it covers a surprising amount of ground.

## The App

A single-page application where you can:

- Upload images by dragging them onto the page or clicking a button
- See your uploaded images in a grid
- Click an image to view it full-size
- Delete images you don't want

That's it. Nothing fancy. And that's the point.

## Why This Project?

This little app teaches you foundational skills that every SaaS product needs:

- **Scaffolding a project** from scratch using React Router v7
- **Uploading files locally** and understanding where they live on your machine
- **Connecting to an external service** (UploadThing for cloud file storage)
- **Handling user interactions** (drag, click, confirm delete)
- Making your first **commits** and working with **branches** in Git

These are the same skills you'll use whether you're building a project management tool, a client portal, or the next Dubsado. The scale changes, the fundamentals don't.

## Your First Git Commit

Before we write any code, let's set up version control. If you haven't already, create a GitHub account at [github.com](https://github.com).

Once your project is scaffolded in the next lesson, we'll initialize Git and make our first commit:

```bash
git init
git add .
git commit -m "Initial commit: scaffolded project"
```

From here on out, each build section gets its own **branch**. A branch is like a parallel copy of your code where you can make changes without affecting the main version. When you're done with a section, you merge your branch back into `main`.

```bash
git checkout -b build/image-upload
```

This creates a new branch called `build/image-upload`. All the work we do in this module happens on this branch. When we're done, we'll merge it back to `main` before starting the next build.

This mirrors how real teams work — and it means if something goes wrong, your `main` branch is always in a clean, working state.

## What You'll Need

- Your development environment set up (from the previous module)
- A GitHub account
- An UploadThing account (free — we'll create one together)

If you don't have the accounts yet, that's fine. We'll walk through creating them as we go.

Let's scaffold our first project.
