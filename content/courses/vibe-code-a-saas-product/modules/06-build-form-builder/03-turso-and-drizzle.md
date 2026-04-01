---
title: Setting Up Turso & Drizzle
duration: 12 min
type: hands-on
---

# Setting Up Turso & Drizzle

Time to give our form builder a memory. Right now, if you refresh the page, everything disappears. A database fixes that.

## Why Turso?

Turso runs SQLite databases in the cloud. Why I chose it for this course:

- **Free tier** covers everything we need during development and early launch
- **Simple** — SQLite is the most battle-tested database in existence
- **Fast** — your data lives at the edge, close to your users
- **Works great with Drizzle** — type-safe queries that feel like writing TypeScript

## Create a Turso Account

Head to [turso.tech](https://turso.tech) and sign up. Install the CLI:

```bash
brew install tursodatabase/tap/turso  # Mac
# or
curl -sSfL https://get.tur.so/install.sh | bash  # Linux/WSL
```

Log in:

```bash
turso auth login
```

Create a database:

```bash
turso db create form-builder
```

Get the connection URL and auth token:

```bash
turso db show form-builder --url
turso db tokens create form-builder
```

Add both to your `.env`:

```bash
TURSO_DATABASE_URL=libsql://form-builder-yourusername.turso.io
TURSO_AUTH_TOKEN=your-token-here
```

## Install Drizzle

```bash
npm install drizzle-orm @libsql/client
npm install -D drizzle-kit
```

## Define Your Schema

This is where data modeling happens. Create a schema file:

Ask your AI: "Create a Drizzle schema for a form builder. I need:
- A `forms` table with id, title, fields (stored as JSON), createdAt, updatedAt
- A `submissions` table with id, formId (foreign key to forms), data (stored as JSON), createdAt

Use Turso/libsql. Put the schema in `app/db/schema.ts` and the database connection in `app/db/index.ts`."

The schema should look something like:

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const forms = sqliteTable("forms", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  fields: text("fields", { mode: "json" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const submissions = sqliteTable("submissions", {
  id: text("id").primaryKey(),
  formId: text("form_id").notNull().references(() => forms.id),
  data: text("data", { mode: "json" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
```

## Run the Migration

Create a Drizzle config file and generate the migration:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

This creates the tables in your Turso database. Your form builder now has a place to store data.

## Wire It Up

Connect the form builder UI to the database. Ask the AI:

"Connect my form builder to the database. When the user clicks Save, store the form in the `forms` table. When they load the page, fetch their forms from the database. Use React Router server actions for saves and loaders for fetches."

## Test It

Build a form in the UI. Click Save. Refresh the page. Your form should still be there.

That's the magic of databases. Your data persists. Your users can close their browser, come back tomorrow, and their work is waiting for them. This is foundational to every SaaS product you'll ever build.

## Commit

```bash
git add .
git commit -m "Add Turso database and Drizzle ORM for form persistence"
git push
```
