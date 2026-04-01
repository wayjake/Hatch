---
title: Glossary of Common Terms
duration: reference
type: reference
---

# Glossary of Common Terms

A reference guide to the terms used throughout this course. Bookmark this page — come back whenever you encounter a term you're not sure about.

---

## A

**Action** — In React Router, a server-side function that handles form submissions and data mutations. Actions run on the server, not in the browser.

**Auto Scaling Groups** — *Coming soon.*

**API (Application Programming Interface)** — A way for two pieces of software to talk to each other. When your app sends data to Stripe or fetches data from a database, it's using an API.

**API Key** — A secret value that identifies and authenticates your application with an external service. Treat API keys like passwords.

**Authentication (Authn)** — Verifying *who* a user is. "Are you who you say you are?" Logging in is authentication.

**Authorization (Authz)** — Determining *what* an authenticated user is allowed to do. "Can you access this specific resource?" Checking permissions is authorization.

---

## B

**Branch** — Starting a new idea in a codebase, you branch off to create a bucket for new changes to be made.

**Build** — The process of converting your source code into optimized files that can be served to users. Vercel runs a build every time you deploy.

**Build vs. Buy** — *Coming soon.*

**Bash** — The terminal is where we will get very comfortable. Mac utilizes the unix shell which means that it transfers nicely to Linux environments (specialized for the web). This is in contrast with Windows which makes web development obtuse. Some examples of bash are:

```bash
# in bash this indicates a comment, it doesn't run nor do anything
ls                           # this will "list" the current directory
cd {folder name or path}     # change directory is a huge one
                             # ".." means to go back one directory
```

**Bootstrapping** — Building a business without external investment, funding growth through revenue.

---

## C

**CLI (Command Line Interface)** — A text-based interface for running commands. Your terminal is a CLI. Tools like Claude Code and the Turso CLI run in the terminal.

**Client-Side** — Code that runs in the user's browser. React components, click handlers, and animations run client-side.

**Cloudflare** — A service that manages DNS, provides CDN caching, and adds security to your domain.

**Commit** — The incremental portion of a branch. You make some changes in your code and then when you're ready to lock in those changes you commit them. We will usually do this from the command line or with Claude Code. Usually commits have a short summary on the first line and then additional lines can be added for more context.

**CORS (Cross-Origin Resource Sharing)** — A security mechanism that controls which websites can make requests to your server. If your frontend and API are on different domains, you'll encounter CORS.

**CRUD** — Create, Read, Update, Delete — the four basic operations for managing data.

**CSS (Cascading Style Sheets)** — The language that controls how web pages look — colors, fonts, spacing, layout.

---

## D

**Database** — Where your application stores persistent data. User records, form submissions, settings — anything that needs to survive a page refresh lives in a database.

**Deploy / Deployment** — The process of taking your code from your local machine and putting it on a server where users can access it.

**DNS (Domain Name System)** — Translates human-readable domain names (yourapp.com) into IP addresses that computers use. Think of it as a phone book for the internet.

**Drizzle** — A TypeScript ORM (Object-Relational Mapper) that lets you interact with your database using TypeScript instead of raw SQL.

---

## E

**Edge** — Servers distributed around the world, close to users. "Edge computing" means your code runs near the user for faster response times. Turso runs at the edge.

**Environment Variables** — Configuration values stored outside your code (in `.env` locally, in hosting platform settings for production). Used for API keys, database URLs, and other configuration that changes between environments.

**ESM (ECMAScript Modules)** — The modern standard for organizing JavaScript code into reusable modules using `import` and `export`.

---

## F

**Framework** — A pre-built foundation for building applications. React Router v7 is a framework — it provides routing, data loading, and server-side rendering so you don't build those from scratch.

**Frontend** — The part of your application that users see and interact with in their browser. HTML, CSS, and JavaScript that renders the UI.

**Frontend Frameworks** — Primarily Javascript based. They take the complexity of developing in raw javascript and html and wrap it into something higher level. Angular, React, and so many more.

---

## G

**Git** — A version control system that tracks changes to your code over time. Every change is saved as a commit, and you can always go back to a previous version.

**GitHub** — Git is a style of tracking code changes efficiently over time. GitHub is an online place to host the code. It allows us to deliver the code to the cloud with great observability.

---

## H

**Hosting** — The service that makes your application available on the internet. Vercel hosts your app — they run the servers that respond when someone visits your URL.

**Hot Reload** — A development feature where changes to your code automatically appear in the browser without a full page refresh.

**HTTP / HTTPS** — The protocol browsers use to communicate with servers. HTTPS is the secure version (encrypted). Your production site should always use HTTPS.

---

## I

**IDE (Integrated Development Environment)** — A code editor with extra features like debugging, terminal, and extensions. VS Code is an IDE.

**Idempotent** — An operation that produces the same result no matter how many times you run it. Important for webhook handlers — processing the same event twice shouldn't cause problems.

---

## J

**JSON (JavaScript Object Notation)** — A data format used to exchange information between systems. APIs almost always send and receive JSON.

**JSX / TSX** — A syntax that lets you write HTML-like code inside JavaScript/TypeScript. It's how React components describe their UI.

---

## L

**Loader** — In React Router, a server-side function that fetches data before a page renders. Loaders run on every navigation to a route.

**Localhost** — Your own computer acting as a server during development. `localhost:5173` means "this machine, port 5173."

---

## M

**Main Branch** — The primary branch in git (usually called `main`). This is the "real" version of your code that gets deployed to production.

**Merge** — When we are ready to put a new branch into our main branch, we merge the code. Usually we utilize a technique which takes all of the commits from the change and then puts them into a single commit. This lets our code history be readable over time.

**Migration** — A scripted change to your database structure (adding tables, columns, etc.). Drizzle generates migrations from your schema changes.

**MVP (Minimum Viable Product)** — The smallest version of your product that delivers value. Just enough to test your idea with real users.

---

## N

**Node.js** — A runtime that lets you run JavaScript on the server (not just in the browser). It's what powers your React Router server-side code.

**npm (Node Package Manager)** — A tool for installing and managing JavaScript packages (libraries, frameworks, tools).

---

## O

**OAuth** — An authentication protocol that lets users grant your app access to their accounts on other services (Google, GitHub, etc.) without sharing their passwords.

**ORM (Object-Relational Mapper)** — A library that lets you interact with a database using your programming language instead of SQL. Drizzle is an ORM.

---

## P

**Package** — A reusable piece of code published to npm. When you `npm install stripe`, you're installing the Stripe package.

**Preview Deployment** — A temporary deployment created for a git branch. Vercel creates one for every push that isn't to `main`. Useful for testing before going live.

**Private Key** — A secret value known only to your server. Used to authenticate with external services. Never expose in browser code or commit to git.

**Production** — The live environment where real users interact with your application. See also: *Development*, *Staging*.

**Programming Languages** — Java, Javascript, C, C++, Perl, PHP, Python, Ruby. These are the top more utilized languages since the 90's. Each has tradeoffs. Javascript has the lowest learning curve and can be utilized for pretty much anything. Other languages include C# (Microsoft), Objective C (Apple), Rust (primarily used by uber nerds and/or uber scale requirements), Zig, Odin, and many more.

**Prompt Injection** — A security vulnerability where user input manipulates AI model behavior by injecting instructions into the prompt.

**Public Key** — A value that can safely be exposed in browser code. Identifies your app but doesn't grant access on its own.

**Pull** — Take the possibly old code (let's say someone else pushed code to the branch you're on and you want to grab those updates) and pull those into your working environment.

**Pull Request** — Inside GitHub, it's a place to show changes in code between two different branches.

**Push** — Take code that you've "committed" to the current branch and push it to the cloud (GitHub).

---

## R

**Rate Limiting** — Restricting how many requests a user or IP can make in a given time period. Prevents abuse and protects API budgets.

**Repository (Repo)** — A project tracked by git. Contains all your code files and their complete change history.

**Route** — A URL pattern mapped to a specific page or handler in your application. `/dashboard` is a route.

---

## S

**SaaS (Software as a Service)** — Software delivered over the internet, typically with a subscription pricing model. Dubsado, Slack, and Notion are SaaS products.

**Schema** — The structure of your database — what tables exist, what columns they have, and how they relate to each other.

**Server-Side** — Code that runs on the server, not in the user's browser. Database queries, API key usage, and authentication checks happen server-side.

**Server-Side Rendering (SSR)** — Generating HTML on the server before sending it to the browser. Makes pages load faster and helps with SEO.

**SQL (Structured Query Language)** — The language used to interact with relational databases. `SELECT * FROM users` is SQL.

**SSH (Secure Shell)** — A protocol for secure communication between computers. Used for pushing code to GitHub without passwords.

**SSL/TLS** — Encryption protocols that make HTTPS work. The padlock icon in your browser means SSL is active.

**Staging** — An environment that mirrors production but uses test data. For testing changes before they go live.

---

## T

**Tailwind CSS** — A utility-first CSS framework. Instead of writing custom CSS classes, you apply pre-built utility classes directly to elements (`className="text-lg font-bold"`).

**Terminal** — The application where you type commands. Also called "console" or "command line." On Mac, it's the Terminal app. On Windows with WSL, it's the Ubuntu terminal.

**Token** — A string of characters that represents authentication or authorization. API tokens authenticate your app. Session tokens authenticate your users.

**Turso** — A cloud database service that runs SQLite at the edge. Fast, simple, and affordable.

**TypeScript** — JavaScript with types. Adds type annotations that catch bugs before your code runs. `const name: string = "Jake"` tells TypeScript that `name` must be a string.

---

## U

**User Story** — A first principle outline of a function of your application. It should usually only contain one user action. They formally look like this: "as a user, I can upload my profile image". In this example you can see it doesn't matter where they do it or even if it can be done in more than one place. You may have sub-roles like "as an admin user, I can delete a template" or "as a basic user, I don't see the delete template button". We will have a simplified version of this where you can write out what the story is and then tag which type of user this will apply to.

---

## V

**Vercel** — *Coming soon.*

**Version Control** — A system for tracking changes to code over time. Git is the most widely used version control system.

**VPS (Virtual Private Server)** — *Coming soon.*

**Vibe Coding** — Building software by describing what you want in natural language and using AI to generate the code, while you review, steer, and verify.

---

## W

**Webhook** — An automated HTTP request sent from one service to another when an event occurs. Stripe sends webhooks when payments happen.

**Wireframe** — A rough sketch of a page layout. Boxes, labels, and arrows — not a finished design.

**WSL (Windows Subsystem for Linux)** — A feature that lets you run a Linux terminal inside Windows. Essential for web development on Windows.

---

## X

**XSS (Cross-Site Scripting)** — A security vulnerability where an attacker injects malicious scripts into your website that run in other users' browsers.
