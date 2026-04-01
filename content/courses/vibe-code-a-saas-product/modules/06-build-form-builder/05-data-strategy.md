---
title: Why Your Data Strategy Matters
duration: 8 min
type: listen-along
---

# Why Your Data Strategy Matters

We just built a form builder with a database. Let me zoom out and talk about why the database decisions you make early on are some of the most important decisions in your entire product.

## Your Data Outlives Your Code

Here's something I learned the hard way building Dubsado: **code gets rewritten. Data doesn't.**

Over the years, we rewrote the Dubsado frontend multiple times. We refactored the API. We changed frameworks. But the data — the actual customer records, invoices, contracts, form submissions — that data stayed. It migrated from version to version, always the real foundation of the product.

Your code is the house. Your data is the land. You can rebuild the house. You can't easily move the land.

## What This Means for You

When you're designing your data model, think harder than you think you need to:

- **What data are you storing?** Be explicit. Know every field and why it exists.
- **How does it relate?** Forms have submissions. Users have projects. Projects have tasks. These relationships matter.
- **What can't be undone?** Deleting a user's data is permanent. Think about soft deletes (marking as deleted instead of actually removing) for important records.
- **What's sensitive?** Email addresses, payment info, personal data — these require extra care, both technically and legally.

## The Drizzle Advantage

Using an ORM like Drizzle gives you:

- **Migrations** — tracked, versioned changes to your database structure. You can see every change you've ever made and replay them on a new database.
- **Type safety** — your TypeScript code knows the shape of your data. Typos in column names get caught before they reach your users.
- **Schema as documentation** — your schema file is a living document that describes your entire data model.

## Common Mistakes

**Storing too much in JSON columns.** We used JSON for form fields in our builder — that's fine because the structure is truly dynamic. But don't use JSON for data that should be in proper columns. If you're going to query by it, filter by it, or sort by it, it should be a column.

**Not thinking about backups.** Turso handles backups for you, but know where your data lives and how to recover it. Ask yourself: if your database disappeared right now, what would you lose?

**Ignoring data migration.** Your schema will change as your product evolves. New fields, renamed columns, new tables. Drizzle migrations handle this, but you need to think about existing data when you make changes. Adding a required column to a table that already has rows? You need a default value or a migration step.

## The Bottom Line

Your database is the most valuable part of your application. Treat it that way. Think about it carefully. Back it up. Understand what's in it. Every decision you make about data in the early days will echo through the entire life of your product.
