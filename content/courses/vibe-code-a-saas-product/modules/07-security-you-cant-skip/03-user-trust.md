---
title: What Your Users Trust You With
duration: 6 min
type: listen-along
---

# What Your Users Trust You With

I want to get a little philosophical here, because security isn't just a technical topic. It's a trust topic.

## The Implicit Contract

When someone signs up for your SaaS product, they're making an implicit agreement with you: "I'm going to give you my data, and I trust you to keep it safe."

They trust you with their email address. Their name. Maybe their business data, their client lists, their financial information. This is a real responsibility.

At Dubsado, our users trusted us with their client contracts, their invoices, their business workflows. When a photographer stored a wedding contract in Dubsado, they were trusting us with one of the most important documents of their client's life. We took that seriously. Every security decision we made was filtered through: "What would happen if this data leaked?"

## You Don't Need to Be a Security Expert

I'm not telling you this to scare you. I'm telling you this so you approach security decisions with the right mindset.

You don't need to be a security expert. You need to:

1. **Use managed services** for the hard stuff (Clerk for auth, Stripe for payments)
2. **Follow the patterns** we've covered (input validation, authorization checks, key management)
3. **Never store what you don't need.** The safest data is data you never collected.
4. **Be honest when things go wrong.** If there's a security issue, tell your users. They'll trust you more for being transparent, not less.

## Practical Checklist

Before you launch, run through this:

- [ ] **Authentication** is handled by a managed service (Clerk)
- [ ] **Authorization** checks are on every endpoint that returns user data
- [ ] **API keys** are in environment variables, never in code
- [ ] **`.env`** is in `.gitignore`
- [ ] **User input** is validated on the server
- [ ] **HTTPS** is enabled (Vercel and Cloudflare handle this automatically)
- [ ] **Passwords** are never stored by your application (Clerk handles this)
- [ ] **Sensitive data** isn't logged to the console in production

This isn't an exhaustive security audit. But it covers the fundamentals, and it's more than many early-stage products do.

## The Mindset

Security is an ongoing practice, not a box you check. Every new feature is a chance to introduce a vulnerability. Every user input is a chance for abuse. Every API key is a secret that needs protecting.

But here's the good news: by choosing managed services for the hardest parts and following the patterns in this course, you're starting from a strong position. You don't need to be perfect. You need to be thoughtful.

Your users are trusting you. Earn that trust.
