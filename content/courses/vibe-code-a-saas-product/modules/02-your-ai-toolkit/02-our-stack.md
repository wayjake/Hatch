---
title: Our Stack and Why We're Committing to It
duration: 12 min
type: listen-along
---

# Our Stack and Why We're Committing to It

One of the biggest mistakes I see new founders make is spending weeks evaluating tools instead of building. I'm going to cut through that for you right now. Here's the stack we're using, and here's why.

## The Stack

| Layer | Tool | Why |
|-------|------|-----|
| **Framework** | React Router v7 | Server-side rendering, file-based routing, battle-tested |
| **Language** | TypeScript | Catches bugs before they happen, AI generates better TS than JS |
| **Styling** | Tailwind CSS | Fast, consistent, AI produces excellent Tailwind |
| **Runtime** | Node.js / npm | The standard. Massive ecosystem. |
| **Database** | Turso (SQLite at the edge) | Simple, fast, generous free tier |
| **ORM** | Drizzle | Type-safe, lightweight, works great with Turso |
| **Auth** | Clerk | Managed authentication so you never touch passwords |
| **Hosting** | Vercel | One-click deploys from GitHub |
| **DNS** | Cloudflare | Fast, free, easy domain management |
| **Version Control** | Git + GitHub | The standard |

## Why React Router v7?

React Router v7 in framework mode gives you server-side rendering out of the box. That means your pages load fast, search engines can read them, and you can run server-side code (database queries, API calls) right in your route files.

It's the spiritual successor to Remix, which was built by the same team. The patterns are clean, the documentation is solid, and AI has tons of training data on it.

## Why TypeScript Instead of JavaScript?

TypeScript is JavaScript with types. Instead of guessing what shape your data is, the code tells you explicitly. This matters for two reasons:

1. **You catch mistakes before they happen.** Typos, missing fields, wrong data shapes — TypeScript catches them while you're writing, not when a user hits a bug.
2. **AI generates better TypeScript.** When the AI knows the types, it writes more accurate code. It's like giving an assistant a detailed brief instead of a vague request.

If you've never used TypeScript, don't worry. Vibe coding with AI handles most of the type annotations for you. You'll pick it up as we go.

## Why Tailwind Instead of Raw CSS?

CSS is the language that controls how things look on the web — colors, spacing, fonts, layouts. Raw CSS works, but it's verbose and easy to make inconsistent.

Tailwind gives you utility classes that you apply directly to your HTML. Instead of writing a CSS file that says "make this text bold and blue," you write `className="font-bold text-blue-600"` right on the element.

Two reasons this matters for vibe coding:

1. **AI is exceptionally good at generating Tailwind.** It's like a shared vocabulary between you and the AI. "Make the padding larger" becomes a simple class change.
2. **Consistency.** Tailwind's design system means your spacing, colors, and typography stay consistent without you having to think about it.

## Why Commit to a Stack?

I can feel some of you wanting to explore options. "But what about Next.js? What about Svelte? What about Firebase?"

Stop.

Here's what I learned building Dubsado: **picking a stack and committing to it is more valuable than picking the "best" stack.** There is no best stack. There are only stacks you know well and stacks you don't.

Every hour you spend comparing frameworks is an hour you're not building your product. The stack I've chosen here is excellent. It's modern, it's well-supported, AI knows it inside and out, and it will scale to tens of thousands of users without a rewrite.

Commit. Build. You can always change tools later — but you can't get back the time you spent deliberating.
