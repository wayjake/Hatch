---
title: Authentication vs Authorization
duration: 8 min
type: listen-along
---

# Authentication vs Authorization

These two words sound similar, and people mix them up constantly. But they mean very different things, and confusing them leads to security bugs.

## Authentication: "Who Are You?"

**Authentication** (often shortened to "authn") is verifying someone's identity. When a user logs in with their email and password, you're authenticating them. You're answering the question: "Is this person who they claim to be?"

Methods of authentication:

- Email and password
- Social login (Google, GitHub, etc.)
- Magic links (emailed login links)
- Multi-factor authentication (password + phone code)

In our stack, **Clerk** handles authentication for us. We never touch passwords, we never store credentials, we never build a login flow from scratch. This is intentional and important — we'll talk about why in the scaffolding module.

## Authorization: "What Can You Do?"

**Authorization** (often shortened to "authz") is determining what an authenticated user is allowed to do. You know *who* they are — now, *what can they access?*

Examples:

- A regular user can see their own projects. An admin can see everyone's projects.
- A free-tier user can create 3 forms. A pro user can create unlimited forms.
- Only the form creator can view submissions. Respondents can only fill out the form.

Authorization is where most security bugs hide. The AI will generate code that authenticates users (checks if they're logged in) but often forgets to authorize them (checks if they're allowed to do the specific thing they're trying to do).

## A Real Example

Imagine this API endpoint:

```typescript
// Load a form's submissions
export async function loader({ params }: LoaderArgs) {
  const submissions = await db
    .select()
    .from(submissionsTable)
    .where(eq(submissionsTable.formId, params.formId));
  return { submissions };
}
```

This has an authentication check missing (is the user logged in?) and an authorization check missing (does this user own this form?).

Anyone who guesses a form ID can see all its submissions. That's a data leak.

Here's the fixed version:

```typescript
export async function loader({ params, request }: LoaderArgs) {
  // Authentication: who is this?
  const user = await requireUser(request);

  // Authorization: can they access this form?
  const form = await db
    .select()
    .from(formsTable)
    .where(eq(formsTable.id, params.formId))
    .get();

  if (!form || form.userId !== user.id) {
    throw new Response("Not found", { status: 404 });
  }

  // Now safe to load submissions
  const submissions = await db
    .select()
    .from(submissionsTable)
    .where(eq(submissionsTable.formId, params.formId));

  return { submissions };
}
```

Notice we return a 404 instead of a 403 (Forbidden). This is on purpose — if someone is guessing form IDs, you don't want to confirm that a form exists. "Not found" reveals nothing.

## The Dubsado Lesson

At Dubsado, authorization was some of the most carefully reviewed code in the entire codebase. Every endpoint, every query, every action — we checked: does this user have the right to do this specific thing?

Because here's what's at stake: if a photographer can accidentally see another photographer's client contracts, that's not just a bug. That's a trust-destroying, potentially lawsuit-generating incident. Authorization isn't glamorous work, but it's the work that keeps your users safe.

## The Rule

Every time you write a loader or an action that touches data, ask two questions:

1. **Is the user authenticated?** (Are they logged in?)
2. **Is the user authorized?** (Are they allowed to access this specific data?)

If the answer to either question is "I'm not sure," you have a security bug. Fix it before you ship it.
