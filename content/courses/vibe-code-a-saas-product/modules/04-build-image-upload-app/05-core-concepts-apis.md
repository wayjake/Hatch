---
title: "Core Concepts: What Is an API?"
duration: 7 min
type: listen-along
---

# Core Concepts: What Is an API?

We just used the UploadThing API. But what is an API, actually?

## The Simple Explanation

**API** stands for Application Programming Interface. It's a way for two pieces of software to talk to each other.

When your app sends an image to UploadThing, it's making an API call. It's saying: "Here's an image file. Store it and give me back a URL where I can find it." UploadThing's API receives that request, does the work, and sends back a response.

Think of it like a restaurant. You (the customer) don't walk into the kitchen and cook your own food. You tell the waiter (the API) what you want, the kitchen (the service) prepares it, and the waiter brings it back.

## APIs Are Everywhere

Every external service you'll use in your SaaS has an API:

- **UploadThing's API** — "store this file, give me a URL"
- **Stripe's API** — "charge this customer $49, tell me if it worked"
- **Clerk's API** — "is this user logged in? what's their email?"
- **Claude's API** — "here's a prompt, give me a response"
- **Mailchimp's API** — "add this email to my mailing list"

When you hear someone say "integrate with Mailchimp," they mean "use Mailchimp's API to send and receive data."

## Request and Response

Every API interaction follows the same pattern:

1. Your app sends a **request** — "I want to do this thing"
2. The service processes it
3. The service sends back a **response** — "here's the result" (or "something went wrong")

The request includes what you want to do and any data needed to do it. The response includes the result and a status code (200 = success, 400 = you sent something wrong, 500 = the service broke).

## API Keys

Most APIs require authentication — they need to know *who* is making the request. That's what your `UPLOADTHING_TOKEN` is. It's your identity, proving to UploadThing that you're authorized to use their service.

This is why we keep API keys in `.env` and never commit them to git. If someone gets your API key, they can use the service as you — potentially running up charges or accessing your data.

We'll cover API key security in much more detail in the security module. For now, just remember: **keys are secrets. Treat them like passwords.**

## Why This Matters for Your SaaS

Your SaaS product will both *use* APIs (connecting to services like Stripe, email providers, AI models) and potentially *expose* an API (letting other software interact with your product).

Understanding the concept now means you'll recognize the pattern every time we encounter it. And we'll encounter it constantly — the next project, the form builder, your own SaaS product. APIs are the connective tissue of modern software.
