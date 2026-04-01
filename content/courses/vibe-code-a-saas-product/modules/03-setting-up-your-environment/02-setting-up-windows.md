---
title: Setting Up on Windows
duration: 15 min
type: hands-on
---

# Setting Up on Windows

If you're on Windows, don't worry — you can absolutely do everything in this course. The setup is a little different, but once you're past this lesson, everything else will look the same.

## Step 1: Install Windows Subsystem for Linux (WSL)

This is the single most important step. WSL gives you a real Linux terminal inside Windows, which makes web development dramatically easier.

Open **PowerShell as Administrator** (right-click the Start button → "Terminal (Admin)") and run:

```powershell
wsl --install
```

This installs Ubuntu by default. Restart your computer when prompted.

After restart, Ubuntu will open and ask you to create a username and password. Do that.

From now on, **do your development work inside WSL**, not in PowerShell.

## Step 2: Install Node.js (Inside WSL)

Open your Ubuntu terminal and run:

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verify:

```bash
node --version
npm --version
```

## Step 3: Install Git (Inside WSL)

Git usually comes with Ubuntu, but let's make sure it's current:

```bash
sudo apt-get update
sudo apt-get install -y git
```

Verify:

```bash
git --version
```

## Step 4: Configure Git

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

## Step 5: GitHub SSH Setup

```bash
ssh-keygen -t ed25519 -C "you@example.com"
```

Press Enter through prompts.

Copy the public key — since you're in WSL, you'll need to manually display and copy it:

```bash
cat ~/.ssh/id_ed25519.pub
```

Select the output, copy it, then go to GitHub → Settings → SSH and GPG Keys → New SSH Key. Paste and save.

Test:

```bash
ssh -T git@github.com
```

## Step 6: Install VS Code

Download VS Code from [code.visualstudio.com](https://code.visualstudio.com) and install it normally on Windows.

Then install the **WSL extension** in VS Code. This lets VS Code connect to your WSL environment seamlessly.

To open a WSL folder in VS Code, run this from your Ubuntu terminal:

```bash
code .
```

It'll install the VS Code server in WSL the first time. After that, you'll be working in VS Code but running everything in Linux. Best of both worlds.

## Step 7: Install Claude Code (Inside WSL)

```bash
npm install -g @anthropic-ai/claude-code
```

## Step 8: Verify Everything

```bash
mkdir ~/test-project
cd ~/test-project
git init
npm init -y
```

Clean up:

```bash
cd ~
rm -rf ~/test-project
```

## Important Note

All development commands in the rest of this course should be run **inside your WSL terminal**, not in PowerShell or Command Prompt. The commands are identical to Mac at that point — that's the beauty of WSL.

If you ever get confused about whether you're in WSL or Windows, check your terminal prompt. WSL will show something like `username@COMPUTERNAME:~$`. PowerShell will show `PS C:\>`.
