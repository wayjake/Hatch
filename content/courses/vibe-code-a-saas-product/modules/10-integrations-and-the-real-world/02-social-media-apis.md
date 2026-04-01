---
title: Connecting Social Media APIs
duration: 10 min
type: listen-along
---

# Connecting Social Media APIs

Depending on your SaaS, you might need to connect to social media platforms — posting on behalf of users, pulling in content, or displaying social feeds.

## The OAuth Dance

Social media APIs (Instagram, Facebook, Twitter, LinkedIn) use **OAuth** for authentication. This is different from API keys.

With an API key, your app authenticates itself. With OAuth, your app authenticates *on behalf of a user*. The flow:

1. User clicks "Connect Instagram" in your app
2. Your app redirects to Instagram's login page
3. User logs into Instagram and approves your app's access
4. Instagram redirects back to your app with a temporary code
5. Your server exchanges that code for an access token
6. You store the access token and use it for API calls

This is called the "OAuth dance," and it's the same pattern across almost every social platform.

## The Reality

Let me be honest: social media API integrations are some of the most frustrating things in software development. Here's why:

- **Rate limits** — platforms limit how many API calls you can make per hour
- **Changing APIs** — platforms update or deprecate their APIs regularly
- **Review processes** — some platforms require you to apply for API access and go through a review
- **Scopes and permissions** — you have to request specific access levels, and some require additional approval

At Dubsado, social media integrations were a constant maintenance burden. The APIs would change, access tokens would expire, rate limits would shift. It's not glamorous work.

## When It's Worth It

Social media integration is worth it when it's core to your product's value:

- A social media management tool (obviously)
- A CRM that needs to pull client profiles from LinkedIn
- A marketing tool that posts across platforms
- An analytics dashboard that aggregates social metrics

If social media is a "nice to have" feature, deprioritize it. The integration and maintenance cost is high relative to the value.

## Using a Middleware Service

Instead of integrating directly with each platform's API, consider using a service that handles the complexity:

- **Zapier** / **Make** — connect your app to social platforms through webhooks
- **Buffer API** — for posting to multiple platforms
- **Nango** — manages OAuth connections and token refresh for you

These add a dependency, but they handle the parts that break most often — token refresh, API version changes, rate limit management.

## The Vibe Coding Approach

If you do integrate directly, prompt carefully:

"Set up OAuth for [platform]. I need:
- A 'Connect [Platform]' button that starts the OAuth flow
- A callback route that exchanges the code for an access token
- Store the access token in the database (encrypted)
- A utility function to make API calls with the token
- Token refresh logic if the token expires"

Review the generated code carefully — especially token storage. Access tokens are sensitive. Store them encrypted if possible, and never expose them to the client.

## Start Simple

If social media integration isn't core to your MVP, skip it. You can always add it later. Focus on the integrations that directly serve your core user stories. For most SaaS products, that's email, payments, and authentication — which we've already covered.
