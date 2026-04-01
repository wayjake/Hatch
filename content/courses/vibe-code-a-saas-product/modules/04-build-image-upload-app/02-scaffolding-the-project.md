---
title: Scaffolding the Project
duration: 10 min
type: hands-on
---

# Scaffolding the Project

This is it. Your first real project. Open your terminal and let's go.

## Create the Project

```bash
npx create-react-router@latest image-uploader --yes
cd image-uploader
```

This gives you a React Router v7 project with everything wired up — TypeScript, Tailwind CSS, server-side rendering. All the things we talked about in our stack discussion.

## Open It in VS Code

```bash
code .
```

Take a minute to look at the file structure:

```
image-uploader/
  app/
    routes/       ← your pages live here
    root.tsx      ← the shell that wraps every page
    routes.ts     ← defines which files map to which URLs
    app.css       ← global styles (Tailwind)
  public/         ← static files (favicon, etc.)
  package.json    ← your dependencies and scripts
```

This is a convention you'll see in every project we build. The `app/` folder is where your code lives. `routes/` is where your pages live. `root.tsx` is the outer shell.

## Initialize Git

Your project already has a git repo (the scaffolding tool created one), but let's make your first intentional **commit**:

```bash
git add .
git commit -m "Initial project scaffold"
```

That's your first commit. You just created a save point that you can always return to.

## Push to GitHub

Create a new repository on GitHub (click the "+" in the top right → New repository). Name it `image-uploader`. Don't add a README — we already have one.

Then connect and push:

```bash
git remote add origin git@github.com:YOUR_USERNAME/image-uploader.git
git push -u origin main
```

Your code is now on GitHub. If your laptop catches fire tonight, your code survives.

## Run It Locally

```bash
npm run dev
```

Open your browser to `http://localhost:5173`. You should see the default React Router welcome page.

Nothing exciting yet — but you've just:

- Created a project ✓
- Made a **commit** ✓
- **Pushed** to **GitHub** ✓
- Started a local development server ✓

These four actions are the heartbeat of everything we'll do. Get comfortable with them.

## Clean Up the Boilerplate

Before we start building, let's strip out the default welcome page. This is a great first task for vibe coding.

Open Claude Code (or your AI tool of choice) in your project directory and tell it:

"Remove the boilerplate welcome page. Replace it with a clean, empty page that just says 'Image Uploader' as a heading. Keep the Tailwind setup and Inter font."

Review what it generates. Accept it. **Commit** the change:

```bash
git add .
git commit -m "Clean up boilerplate, add placeholder home page"
```

See the pattern? Build something, commit it. Build something, commit it. This is the rhythm.

Next up, we'll connect UploadThing and make this app actually do something.
