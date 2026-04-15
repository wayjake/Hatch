---
title: Local SQLite with Drizzle
duration: 15 min
type: hands-on
---

# Local SQLite with Drizzle

Let's start with the simplest possible database: a SQLite file on your machine.

## What Is SQLite?

SQLite is a database that lives in a single file. No server to install, no connection string to configure, no account to create. It's just a file — like `database.db` — sitting in your project folder.

Despite being simple, SQLite powers more applications than any other database engine in the world. It runs on your phone, in your browser, and in millions of apps. It's a great place to start.

## What Is Drizzle?

**Drizzle** is an ORM — an Object-Relational Mapper. It lets you define your database structure in TypeScript and interact with your data using code instead of raw SQL.

Instead of writing:

```sql
SELECT * FROM images WHERE user_id = '123';
```

You write:

```typescript
const images = await db.select().from(imagesTable).where(eq(imagesTable.userId, '123'));
```

Same result, but now your database queries are type-safe — your editor catches mistakes before they reach your users.

## Vibe Code the Setup

Open Claude Code:

"I'm adding a local SQLite database to my React Router v7 image upload app using Drizzle ORM. I need:
1. Install drizzle-orm and better-sqlite3 (with its types)
2. A schema file defining an `images` table with: id, title, description, url, createdAt
3. A db connection file that creates or opens a local `sqlite.db` file
4. A drizzle config file for migrations
5. Update my existing routes to save image metadata to the database when uploading, and read from the database when displaying the grid
6. Add a form for title and description during upload"

Let the AI set it up. Then review:

- Does the schema define reasonable column types?
- Does the connection file point to a local file?
- Are the routes using the database for reads and writes?

## Run Migrations

Drizzle generates SQL migrations from your schema. Run:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

This creates the tables in your local SQLite file. You can verify:

```bash
npx drizzle-kit studio
```

Drizzle Studio opens a browser UI where you can see your tables and data. It's like a spreadsheet view of your database.

## Test It

Upload an image with a title and description. Check Drizzle Studio — you should see a new row in the `images` table. Refresh the page — your image and its metadata should still be there.

That's the key difference from before. Without a database, if you renamed a file or restarted your server, the metadata was gone. Now it's persisted.

## Where Does the Data Live?

Look in your project folder:

```bash
ls *.db
```

There's your database — a single file on your machine. You can copy it, back it up, or delete it. It's as tangible as the image files in `public/uploads`.

But just like local file uploads, a local database has the same problem: it only exists on your machine. In the next lesson, we'll move to a cloud database that works everywhere.

## Commit

```bash
git add .
git commit -m "Add local SQLite database with Drizzle ORM"
```
