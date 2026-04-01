---
title: Mapping User Flows and Wireframes
duration: 10 min
type: hands-on
---

# Mapping User Flows and Wireframes

You have your user stories and your moodboard. Now let's map out how your application actually works — the paths users take and the pages they see.

## What Is a User Flow?

A **user flow** is the path a user takes through your application to accomplish a goal. It's a sequence of steps:

```
Landing Page → Sign Up → Onboarding → Dashboard → Create Project → Invite Team
```

User flows connect your user stories to actual pages and interactions.

## Map Your Core Flow

Take your highest-priority user story and map the flow:

1. Where does the user start?
2. What do they click?
3. What page loads?
4. What do they fill out?
5. What happens when they submit?
6. Where do they end up?

For Dubsado, the core flow was:

```
Dashboard → New Client → Fill in details → Save
→ New Proposal → Add services → Send to client
→ Client receives email → Views proposal → Approves
→ Photographer sees "Approved" status
```

Write this out for your product. It doesn't have to be fancy — a numbered list or a simple diagram works fine.

## Why User Flows Help Vibe Coding

When you sit down to build, a user flow tells you exactly what pages you need and in what order. Instead of "I need to build my app," you have:

1. First, build the sign-up page
2. Then, build the dashboard
3. Then, build the "create [thing]" form
4. Then, build the detail view

Each step is a prompt session. Each session produces something you can test and commit.

## Wireframes

A **wireframe** is a rough sketch of a page layout. Not a design — a sketch. Boxes, labels, arrows.

You can wireframe with:

- **Paper and pencil** — fastest method, highly recommended
- **Excalidraw** — free, web-based, feels like drawing on a whiteboard
- **Figma** — if you want something more polished (free tier available)
- **Your AI** — describe the page and ask for an ASCII wireframe

A wireframe for a dashboard might look like:

```
┌──────────────────────────────────────────┐
│  Logo          Dashboard    Settings   ○  │
├──────────┬───────────────────────────────┤
│          │                               │
│  Nav     │   Welcome back, Jake          │
│          │                               │
│  ├ Home  │   ┌─────┐ ┌─────┐ ┌─────┐   │
│  ├ Forms │   │ Stat │ │ Stat│ │ Stat│   │
│  ├ Users │   └─────┘ └─────┘ └─────┘   │
│  └ Sett  │                               │
│          │   Recent Activity             │
│          │   ┌──────────────────────┐    │
│          │   │ Item 1               │    │
│          │   │ Item 2               │    │
│          │   │ Item 3               │    │
│          │   └──────────────────────┘    │
└──────────┴───────────────────────────────┘
```

## From Wireframe to Prompt

A wireframe translates directly to a prompt:

"Build a dashboard page with a sidebar navigation on the left (links: Home, Forms, Users, Settings). The main content area should have a welcome message, three stat cards in a row, and a 'Recent Activity' list below. Use Tailwind, clean design, reference my moodboard."

See how the wireframe gives you specific layout direction? Without it, you'd get whatever the AI defaults to. With it, you get something close to what you envisioned.

## Your Homework

1. **Map the core user flow** for your product (5-10 steps)
2. **Wireframe the 3 most important pages** — landing page, main dashboard/app view, and one feature page
3. **Save them** in your project folder

You don't need to wireframe every page. Just the key ones. As you build, you'll wireframe more pages as needed — or you'll discover that the AI produces something good enough that you don't need to.

This planning work might feel slow compared to jumping into code. But I promise you: an hour of planning saves five hours of building the wrong thing and rebuilding. This is a lesson I learned the expensive way at Dubsado.

Let's build your SaaS.
