---
title: "What We're Building"
duration: 5 min
type: listen-along
---

# What We're Building

In the last module, we learned where files live — first on your machine, then in the cloud with UploadThing. Now we're going to answer the same question for **data**: where does your app's information live?

## The Goal

We're going to add a database to our image upload app. Users will be able to:

- Add titles and descriptions to their uploaded images
- Browse and search through their image library
- See when each image was uploaded

To do this, we need a place to store structured data. That's what a database is — an organized collection of information that your app can read and write to.

## The Journey

We're going to do this in two steps, just like we did with file uploads:

1. **Local first** — Set up a SQLite database on your machine using Drizzle ORM
2. **Cloud second** — Move that same database to Turso, a hosted SQLite service

By the end, you'll understand what a database is, why you need one, and why the "local to cloud" pattern keeps showing up in web development.

## Start a New Branch

First, let's make sure our image upload work is merged and we're starting fresh:

```bash
git checkout main
git merge build/image-upload
git checkout -b build/adding-a-database
```

We're on a new branch. Main has our completed image upload app. Let's build on top of it.
