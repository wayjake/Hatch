---
title: Integrating an AI API
duration: 12 min
type: hands-on
---

# Integrating an AI API

Let's scaffold the project and connect it to an AI model.

## Scaffold

```bash
npx create-react-router@latest haiku-generator --yes
cd haiku-generator
git add .
git commit -m "Initial scaffold"
```

Notice how natural that's becoming? Scaffold, commit. We're building the habit.

## Get Your API Key

You'll need an API key from Anthropic (for Claude) or OpenAI (for GPT). I'll use Claude, but the code is nearly identical for either.

Sign up at [console.anthropic.com](https://console.anthropic.com) and create an API key. Add it to `.env`:

```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Double-check your `.gitignore` includes `.env`. I'm going to keep reminding you about this because I've seen too many people accidentally commit their **private keys** to GitHub. Once a key is in your git history, it's compromised — even if you delete it later.

## Install the SDK

```bash
npm install @anthropic-ai/sdk
```

## Vibe Code the App

Tell your AI assistant:

"Build a haiku generator app. I need:
1. A form with a text input for a topic and a submit button
2. A server action that takes the topic, sends it to the Claude API asking for a haiku about that topic, and returns the result
3. Display the generated haiku in a styled card below the form
4. Keep a list of the last 5 generated haikus on the page
5. Clean, minimal design with Tailwind. Center everything. Light background.

Use the Anthropic SDK. The system prompt should be: 'You are a haiku poet. When given a topic, respond with exactly one haiku. No explanation, no commentary, just the haiku.'"

## The Server Action

The key piece is the server action — it's the code that runs on the server when the form is submitted. This is important: **the API call happens server-side.** Your API key never touches the browser.

The AI should generate something like:

```typescript
const message = await anthropic.messages.create({
  model: "claude-sonnet-4-5-20250514",
  max_tokens: 100,
  system: "You are a haiku poet. When given a topic, respond with exactly one haiku. No explanation, no commentary, just the haiku.",
  messages: [
    { role: "user", content: `Write a haiku about: ${topic}` }
  ],
});
```

Look at that last line: `` `Write a haiku about: ${topic}` ``. The user's input goes directly into the prompt. We'll come back to why this is a problem.

## Test It

```bash
npm run dev
```

Try some topics. "Ocean." "Morning coffee." "A bug in production." You should get back haikus.

## Commit and Push

```bash
git add .
git commit -m "Add AI haiku generation with Claude API"
code . # if you haven't already opened it
```

Create a GitHub repo, push it up, and deploy to Vercel (same process as last time — don't forget to add `ANTHROPIC_API_KEY` to Vercel's environment variables).

The app works. It's live. And it has a security vulnerability. Let's explore it.
