---
title: "Core Concepts: Hosting, Deploying, and Git"
duration: 8 min
type: listen-along
---

# Core Concepts: Hosting, Deploying, and Git

Before we go any further, I want to introduce some terms that are going to come up constantly throughout this course. These are foundational concepts, and I'll revisit them again and again as we build. For now, I just want you to understand them at a high level.

## Hosting

**Hosting** is where your application lives on the internet. When someone types your URL into a browser, hosting is what serves them your application.

Think of it like renting space in a building. Your code is the furniture and decorations — hosting is the building itself. Without it, nobody can visit.

There are dozens of hosting providers. In this course, we'll use **Vercel** because it's simple, has a generous free tier, and works beautifully with the tools we're using. But the concept is the same everywhere: you put your code somewhere, and that somewhere makes it available to the world.

## Deploying

**Deploying** is the act of taking your code from your computer and putting it on a hosting provider so people can use it.

When I was building the early versions of Dubsado, deploying was a stressful, manual process. I'd upload files, pray nothing broke, and refresh the page to see if it worked. Today, deploying can be as simple as pushing your code to GitHub — Vercel sees the change and automatically puts it live.

We'll deploy our very first tutorial project in Module 4. It's going to feel like magic.

## Git

**Git** is a version control system. It tracks every change you make to your code, so you can always go back to a previous version if something breaks.

Imagine writing a book where every save creates a snapshot of the entire manuscript. You can always flip back to any previous snapshot. That's git.

Here are the key terms you need to know:

- **Repository (repo)** — your project folder, tracked by git
- **Commit** — a snapshot of your code at a specific point in time, like pressing "save" with a note about what you changed
- **Branch** — a parallel version of your code where you can experiment without affecting the main version
- **Push** — sending your commits from your computer to a remote location (like GitHub)
- **Pull** — downloading the latest changes from the remote to your computer

## GitHub

**GitHub** is a website that stores your git repositories online. It's where your code lives in the cloud. Think of git as the tool, and GitHub as the service that hosts what the tool produces.

Almost every developer in the world uses GitHub. We will too.

## Why This Matters

I know these concepts feel abstract right now. That's okay. By the time we're done with our first tutorial project, you'll have:

- Created a **repository**
- Made **commits**
- **Pushed** your code to **GitHub**
- **Deployed** to a **host**

And suddenly these words won't be abstract anymore. They'll be things you did.

We'll keep coming back to these terms. Every time we encounter them in practice, I'll remind you what they mean and connect them to what you're doing. Repetition is how this stuff sticks.
