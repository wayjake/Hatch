---
title: Handling Form Submissions
duration: 10 min
type: hands-on
---

# Handling Form Submissions

Our form builder can create and save forms. Now let's make them usable — a public URL where anyone can fill out the form, and a dashboard where you can view the responses.

## The Public Form Page

We need a route that takes a form ID and renders the form for anyone to fill out — no login required.

Ask the AI:

"Create a public form route at `/f/:formId`. It should:
1. Load the form from the database by ID
2. Render the form fields as actual HTML inputs (not the builder view)
3. Handle form submission — validate required fields, save the response to the `submissions` table
4. Show a success message after submission
5. This page should be clean and simple — just the form title and the fields. No navigation."

## Review the Security

When the AI generates the submission handler, check these things:

1. **Is it validating required fields?** If a field is marked required, the server should reject submissions without it.
2. **Is it sanitizing input?** The submission data goes into the database — make sure it's treated as data, not code.
3. **Is it checking that the form ID exists?** A request with a fake form ID should return a 404, not crash.

This is input validation in action — the same principle we learned with XSS and prompt injection.

## The Submissions Dashboard

Now create a page where the form creator can see responses:

"Create a submissions page at `/forms/:formId/submissions`. It should:
1. Load all submissions for this form
2. Display them in a table — one column per form field, one row per submission
3. Show the submission date
4. Include a count of total submissions at the top"

## Test the Full Flow

1. Create a form in the builder
2. Save it
3. Copy the public URL (`/f/[form-id]`)
4. Open it in an incognito window (to simulate a different person)
5. Fill out and submit the form
6. Go back to the submissions page and see the response

That's a complete loop. A creator makes a form, a respondent fills it out, the creator sees the response. This is the exact same loop that powers survey tools, contact forms, client questionnaires — and it was one of the earliest features we built into Dubsado.

## Commit and Deploy

```bash
git add .
git commit -m "Add public form page and submissions dashboard"
git push
```

Deploy to Vercel. Don't forget to add your `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` to Vercel's environment variables.

Once it's deployed, send the public form link to a friend and have them fill it out. Watch the submission appear in your dashboard. That feeling — someone using something you built — never gets old.
