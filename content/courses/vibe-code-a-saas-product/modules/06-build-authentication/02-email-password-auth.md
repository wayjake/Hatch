---
title: Email & Password Authentication
duration: 15 min
type: hands-on
---

# Email & Password Authentication

Let's build a login system from scratch. This is one of the most common features in web development, and understanding how it works under the hood will make you a better builder — even when you use a managed service later.

## How Passwords Work

When a user creates an account with a password, you **never store the actual password**. Instead, you store a **hash** — a one-way transformation of the password.

Think of it like a meat grinder. You can turn a steak into ground beef, but you can't turn ground beef back into a steak. Hashing works the same way:

```
"mypassword123" → hash → "$2b$10$X7rG...a1b2c3" (stored in database)
```

When they log in, you hash what they typed and compare it to the stored hash. If they match, the password is correct. At no point do you know or store the actual password.

This is critical. If your database is ever compromised, attackers get hashes — not passwords. A properly hashed password is computationally impractical to reverse.

## Vibe Code It

Open Claude Code:

"I'm adding email + password authentication to my React Router v7 app with Drizzle and Turso. I need:
1. A `users` table with id, email, passwordHash, and createdAt
2. A sign-up page that takes email and password, hashes the password with bcrypt, and stores the user
3. A login page that verifies the email/password against the database
4. Session management using cookies — after login, set a session cookie; check it on protected routes
5. A logout action that clears the session
6. A `requireUser` utility that redirects to login if no valid session
7. Update the images table to include a userId, and filter images by the logged-in user"

Review the generated code carefully:

- Is the password being hashed with bcrypt (not stored in plain text)?
- Is the session cookie set to `httpOnly` and `secure`?
- Does the login check compare hashed passwords, not plain text?
- Does `requireUser` actually redirect unauthenticated users?

## Test It

1. Sign up with an email and password
2. Check your database — the `users` table should have a `passwordHash` column with a long, random-looking string. Not your actual password.
3. Log in with your credentials
4. Upload an image — it should be associated with your user
5. Log out and log in with a different account — you should see a different (empty) image library
6. Try accessing a protected route without being logged in — you should be redirected

## What You Just Built

You built a working authentication system. Users can sign up, log in, and have their own data. This is the foundation of every multi-user application.

But if you're feeling a little uneasy about the security of what you just built... good. You should be. In the next lesson, we'll talk about everything that can go wrong.

## Commit

```bash
git add .
git commit -m "Add email + password authentication"
```
