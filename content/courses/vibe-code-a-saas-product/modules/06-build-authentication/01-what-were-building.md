---
title: "What We're Building"
duration: 5 min
type: listen-along
---

# What We're Building

Our image upload app stores files in the cloud and data in a database. But right now, anyone can access it. There's no concept of "your" images vs "my" images. Let's fix that by adding authentication.

## The Goal

By the end of this module, our app will have:

- A sign-up and login flow with email and password
- Protected routes that require authentication
- Per-user image libraries (you only see your own uploads)

But we're going to build this in two passes:

1. **DIY first** — Build email + password authentication from scratch, so you understand what's actually happening when a user logs in
2. **Clerk second** — Rip it out and replace it with Clerk, a managed authentication service, so you understand why most teams don't build auth themselves

## Why Both?

Because if you've never built auth yourself, managed services feel like magic. And when something goes wrong with magic, you have no idea how to debug it.

By building it first and then replacing it, you'll understand what Clerk is doing for you — and more importantly, what it's protecting you from.

## Start a New Branch

```bash
git checkout main
git merge build/adding-a-database
git checkout -b build/authentication
```

Clean main, new branch. Let's go.
