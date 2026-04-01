---
title: "Core Concepts: Commits, Repos, and Version Control"
duration: 8 min
type: listen-along
---

# Core Concepts: Commits, Repos, and Version Control

We touched on git earlier. Now I want to go a level deeper, because version control is one of those things that separates "I built a thing" from "I built a thing I can maintain, share, and grow."

## The Commit

A **commit** is a save point. But unlike hitting Ctrl+S, a commit captures the state of your *entire project* and attaches a message describing what changed.

Good commit messages read like a changelog:

- "Add user login page"
- "Fix image upload timeout on large files"
- "Connect Stripe checkout to pricing page"

Bad commit messages tell you nothing:

- "stuff"
- "WIP"
- "fix"

When something breaks three weeks from now — and something will — your commit history is how you figure out what changed and when. Treat it like a logbook.

## The Repository

A **repository** (repo) is your project, tracked by git. It includes:

- All your code files
- The entire history of every commit you've ever made
- Branch information

Your repo lives in two places:

1. **Locally** — on your computer, where you work
2. **Remotely** — on GitHub, where it's backed up and shared

When you **push**, you send your local commits to the remote. When you **pull**, you bring the remote's latest changes to your local copy.

## Branches

A **branch** is a parallel timeline for your code. The main branch (called `main`) is the "real" version. When you want to try something new without risking the main version, you create a branch.

```
main ──────────────────────────────►
        \                    /
         feature-branch ────
```

You build your feature on the branch. If it works, you merge it back into main. If it doesn't, you delete the branch. Main stays clean either way.

For now, we'll mostly work on `main` directly. As your project grows, branches become essential. But early on, simplicity wins.

## Why I'm Hammering This

I've seen founders lose weeks of work because they didn't understand git. Code gets overwritten. Changes disappear. Panic sets in.

Here's the thing: once you develop the habit of committing regularly and pushing to GitHub, losing work becomes nearly impossible. Your code is versioned, backed up, and recoverable.

Early in Dubsado's life, I once accidentally broke a critical feature on a Friday night. Because I had good commit history, I found the exact commit that introduced the bug, reverted it, and was back to working code in 15 minutes. Without version control, that would have been an all-nighter.

## The Habit

Here's what I want you to internalize:

1. **Commit often.** Every time something works, commit it. Small, frequent commits are better than one massive commit at the end of the day.
2. **Push daily.** At minimum. Your code should live on GitHub, not just on your laptop.
3. **Read the diff.** Before you commit, look at what changed. This is your last chance to catch mistakes.

We'll practice this starting with our very first tutorial project. By the time we're done with this course, committing and pushing will be second nature.
