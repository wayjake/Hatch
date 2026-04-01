---
title: Writing User Stories
duration: 10 min
type: hands-on
---

# Writing User Stories

We introduced **user stories** at the end of the form builder module. Now it's time to write them for your own product.

## The Format Refresher

**As a [type of user], I want to [do something], so that [I get some benefit].**

This format forces three good things:

1. You think about who the user is
2. You think about what they're trying to do
3. You think about why they're trying to do it

That "why" is everything. It prevents you from building features that nobody asked for.

## Step 1: Identify Your User Types

Most SaaS products have at least two types of users. For Dubsado, it was:

- **Business owner** — the person running their creative business
- **Client** — the person receiving proposals, filling out forms, signing contracts

For your product, list every type of person who interacts with the system. Be specific:

- Is there a creator and a consumer?
- Is there a free user and a paid user?
- Is there an admin?

## Step 2: Write Stories for Your Core Flow

What's the one thing your product absolutely must do? Write 5-10 user stories around that core flow.

For Dubsado's core flow (client management), the early stories were:

- "As a photographer, I want to create a client profile, so that I have all their info in one place."
- "As a photographer, I want to send a proposal to a client, so that they can review and approve my services."
- "As a client, I want to sign a contract from my phone, so that I don't need to print, scan, and email it back."
- "As a photographer, I want to see which clients have outstanding invoices, so that I can follow up on payments."

## Step 3: Prioritize Ruthlessly

You'll end up with 20, 30, maybe 50 user stories. That's good — it means you understand the problem space.

Now rank them. What's the absolute minimum set of stories that delivers value? This becomes your MVP — your Minimum Viable Product.

For Dubsado's MVP, it was something like:

1. Create a client
2. Send a contract
3. Get a signature
4. Send an invoice

That's it. Four stories. Four features. Enough to be useful.

## Step 4: Add Acceptance Criteria

For each story in your MVP, write what "done" looks like:

> **Story:** "As a photographer, I want to send a proposal to a client..."
>
> **Acceptance Criteria:**
> - I can create a proposal with services and prices
> - I can enter a client's email and send the proposal
> - The client receives an email with a link to view the proposal
> - The client can approve or decline the proposal
> - I can see the proposal status (sent, viewed, approved, declined)

These criteria become your checklist when building. They also make excellent prompts for vibe coding — each criterion is practically a feature description.

## Step 5: Write Them Down

Open a document, a Notion page, a markdown file — wherever you keep notes. Write your stories down. This is your product roadmap. It's not a gantt chart or a spreadsheet. It's a list of things real people need to do, in their words, in order of importance.

You'll reference this list constantly as we build in the next modules.
