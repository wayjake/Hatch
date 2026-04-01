---
title: Claude Code & Codex Basics
duration: 10 min
type: listen-along
---

# Claude Code & Codex Basics

There are a lot of AI coding tools out there. I'm going to focus on two that I think represent the best of what's available right now, and then we'll pick one to use throughout this course.

## Claude Code

Claude Code is a command-line tool from Anthropic. You run it in your terminal — the same place you run your development commands — and it can:

- Read your entire project
- Understand how your files connect to each other
- Generate new code that fits your existing patterns
- Edit multiple files at once
- Run commands and react to errors
- Explain what existing code does

What makes Claude Code different from chatting with an AI in a browser is **context**. It sees your whole codebase. When you say "add a settings page," it knows what your other pages look like, what your routes file contains, what your database schema looks like. It generates code that *fits*.

When Becca and I were building Dubsado, I would have killed for this. The number of hours I spent writing boilerplate — auth pages, CRUD endpoints, form layouts — all of that could have been described in a sentence and generated in seconds.

## Codex

Codex (from OpenAI) is similar in spirit but different in approach. It's also designed to work with your codebase, generate code, and make multi-file changes. The models behind it are different, and the interface has its own feel.

Both tools are legitimate. Both produce good output. The concepts you learn with one transfer directly to the other.

## What We'll Use

For this course, I'll primarily demonstrate with **Claude Code** because it's what I use daily and it works exceptionally well with the stack we're building on. But everything we do applies if you're using Codex, Cursor, or any other AI coding assistant.

The tool doesn't matter as much as the technique. The technique is:

1. Give the AI context about what you're building
2. Describe what you want in clear, specific language
3. Review what it generates
4. Accept, modify, or redirect

That loop is universal.

## The Right Expectations

AI coding tools are not magic. They're extremely capable assistants with some very real limitations:

**They're great at:**
- Generating UI components from descriptions
- Writing database queries
- Setting up project boilerplate
- Explaining code you don't understand
- Catching bugs when you paste in error messages

**They struggle with:**
- Complex business logic that's unique to your product
- Security-sensitive code (we'll talk about this a lot)
- Staying consistent across a very large codebase
- Knowing when to stop — they'll happily over-engineer if you let them

The best vibe coders I've worked with treat AI like a very talented but occasionally reckless junior developer. You wouldn't let a junior deploy to production without code review. Same deal here.
