---
title: Setting Up on Mac
duration: 15 min
type: hands-on
---

# Setting Up on Mac

Time to get your machine ready. This is the foundation everything else builds on, so let's do it right.

I've been developing on Mac for over a decade. It's what I built Dubsado on, and it's what I recommend for web development. The terminal, the tooling, the ecosystem — it all just works.

## Step 1: Install Homebrew

Homebrew is a package manager for Mac. It's how you install developer tools without hunting for download links.

Open **Terminal** (search for "Terminal" in Spotlight, or find it in Applications → Utilities) and paste:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Follow the prompts. When it's done, close and reopen your terminal.

Verify it worked:

```bash
brew --version
```

## Step 2: Install Node.js

Node.js is the runtime that makes JavaScript work outside the browser. npm (Node Package Manager) comes with it — that's how you install libraries and tools.

```bash
brew install node
```

Verify:

```bash
node --version
npm --version
```

You should see version numbers for both. If you do, you're good.

## Step 3: Install Git

Git might already be on your Mac, but let's make sure you have a current version:

```bash
brew install git
```

Verify:

```bash
git --version
```

## Step 4: Configure Git

Tell git who you are. This labels your **commits** with your name and email:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

Use the same email you'll use for GitHub.

## Step 5: Create a GitHub Account

If you don't have one, go to [github.com](https://github.com) and sign up. Free account is all you need.

Then set up SSH authentication so you can push code without typing your password every time:

```bash
ssh-keygen -t ed25519 -C "you@example.com"
```

Press Enter through the prompts (default location is fine, passphrase is optional).

Copy the public key:

```bash
pbcopy < ~/.ssh/id_ed25519.pub
```

Go to GitHub → Settings → SSH and GPG Keys → New SSH Key. Paste it in and save.

Test the connection:

```bash
ssh -T git@github.com
```

You should see a message like "Hi username! You've successfully authenticated."

## Step 6: Install a Code Editor

I recommend **Visual Studio Code** (VS Code). It's free, it has excellent AI integrations, and it's what most web developers use.

```bash
brew install --cask visual-studio-code
```

Or download it from [code.visualstudio.com](https://code.visualstudio.com).

## Step 7: Install Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

You'll need an API key from Anthropic. Set it up when you first run `claude` in your terminal — it'll walk you through the process.

## Step 8: Verify Everything

Let's make sure it all works. Create a test project:

```bash
mkdir ~/test-project
cd ~/test-project
git init
npm init -y
```

If all of those commands worked without errors, your environment is ready.

Clean up:

```bash
cd ~
rm -rf ~/test-project
```

You're set. Your Mac is now a development machine. In the next lesson, I'll cover Windows setup for those who need it — then we'll move on to building real things.
