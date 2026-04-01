---
title: "Core Concepts: User Stories"
duration: 6 min
type: listen-along
---

# Core Concepts: User Stories

We've now built three projects. Before we move on to planning and building your own SaaS, I want to introduce a concept that will change how you think about features: **user stories**.

## What Is a User Story?

A user story is a simple sentence that describes a feature from the user's perspective. It follows this format:

**As a [type of user], I want to [do something], so that [I get some benefit].**

Examples from the form builder we just built:

- "As a form creator, I want to drag fields onto a canvas, so that I can build forms visually."
- "As a form respondent, I want to fill out a form at a public URL, so that I can submit my information."
- "As a form creator, I want to see all submissions in a table, so that I can review responses."

## Why They Matter

User stories force you to think about **who** is doing **what** and **why**. This is more powerful than it sounds.

When we were building Dubsado, Becca would come to me with requests from users: "Photographers need to send questionnaires." Without user stories, I might build a generic form tool. With user stories, we got specific:

- "As a photographer, I want to send a questionnaire before a shoot, so that I know the client's preferences."
- "As a photographer, I want to require certain fields, so that clients don't skip important questions."
- "As a client, I want to fill out the questionnaire on my phone, so that I don't need to be at a computer."

See how each story points you toward specific decisions? Mobile-friendly. Required fields. Pre-shoot timing. These aren't vague features — they're targeted solutions.

## User Stories and Vibe Coding

Here's where it gets really practical: **user stories make excellent prompts.**

Take this story: "As a form creator, I want to drag fields onto a canvas so that I can build forms visually."

That translates almost directly to a prompt: "Build a form builder where users can drag field types (text, textarea, select, checkbox) onto a canvas to visually construct a form."

The more specific your user stories, the more specific your prompts, and the better your AI-generated code.

## Writing Good User Stories

A few guidelines:

- **Be specific about the user.** "As a user" is too vague. "As a free-tier user" or "As an admin" tells you who this feature serves.
- **Focus on the outcome, not the implementation.** "I want to filter projects by status" — not "I want a dropdown menu that queries the database."
- **Keep them small.** If a story feels big ("I want to manage my entire business"), break it into smaller stories.
- **Include acceptance criteria.** What does "done" look like? "When I drag a text field to the canvas, it appears in the position where I dropped it."

## What's Coming

In the planning module, we're going to write user stories for your own SaaS product. They'll become the blueprint for everything you build. When you sit down with Claude Code and say "build this feature," your user stories will be the brief.

Get comfortable with this format. You'll use it constantly.
