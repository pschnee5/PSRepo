# Vibe Coding Guide
### Your plain-English reference for building projects with Claude Code

---

## Table of Contents

1. [How to start a new project](#1-how-to-start-a-new-project)
2. [How to talk to Claude Code](#2-how-to-talk-to-claude-code)
3. [How to save your work with Git](#3-how-to-save-your-work-with-git)
4. [Common commands I'll use every day](#4-common-commands-ill-use-every-day)
5. [What to do when something breaks](#5-what-to-do-when-something-breaks)
6. [Glossary of terms](#6-glossary-of-terms)

---

## 1. How to Start a New Project

Every new project starts from your template. Here's the routine:

### Step 1 — Duplicate the template

Copy the `_template` folder and give it a new name.
On the command line, it looks like this:

```bash
cp -r /path/to/MyProjects/_template /path/to/MyProjects/my-new-project
```

Or just do it in your file explorer: right-click `_template` → Duplicate → rename.

### Step 2 — Open VS Code in that folder

```bash
code /path/to/MyProjects/my-new-project
```

Or open VS Code, go to **File → Open Folder**, and pick your new project folder.

### Step 3 — Start live-server so you can see your page

In the VS Code terminal (press `` Ctrl+` `` to open it), type:

```bash
npx live-server
```

Your browser will automatically open at `http://127.0.0.1:8080`.
Every time you save a file, the page refreshes instantly.

### Step 4 — Initialize Git for the new project

```bash
git init
git add .
git commit -m "initial setup"
```

### Step 5 — Start describing what you want to Claude

Tell Claude Code in plain English what you want your app to do. You're ready to vibe.

---

## 2. How to Talk to Claude Code

You don't need to know how to code to get results. You just need to describe what you want clearly.

### The golden rules

**Be specific about what you want to see or happen.**
Instead of: "Make it look better"
Try: "Change the background color to dark blue and make the heading font larger"

**Ask for one thing at a time.**
Instead of: "Add a login page, a shopping cart, and a contact form"
Try: "Add a contact form with fields for name, email, and message"
Then after that's done: "Now add a shopping cart"

**Ask Claude to explain anything you don't understand.**
"What does that code do in plain English?"
"Why did you use that approach instead of a simpler one?"
"What would happen if I deleted that line?"

### Good prompts to use

- "Add a button that does X when clicked"
- "Make the page look good on mobile phones"
- "Create a section that shows a list of items from this data: [paste your data]"
- "I want users to be able to type in a box and see results filter as they type"
- "Connect this to the OpenAI API so users can ask questions"
- "Make the colors match this style: [describe or paste a hex code]"
- "Something broke — here's the error: [paste error message]. What happened and how do I fix it?"

### What to NOT worry about

- You don't need to understand every line of code Claude writes
- You don't need to memorize commands
- You don't need to know the "right" way to do things before asking
- You can always ask Claude to undo something or try a different approach

---

## 3. How to Save Your Work with Git

Git is like a save system with unlimited undo. Here's all you need to know day-to-day.

### The three commands you'll use most

```bash
git add .
git commit -m "short description of what you changed"
git push
```

**What each one means:**

| Command | What it does | Analogy |
|---------|--------------|---------|
| `git add .` | Tells Git "I want to save these files" | Putting items in a shopping cart |
| `git commit -m "..."` | Saves a snapshot with a label | Checking out and getting a receipt |
| `git push` | Uploads your saved snapshot to GitHub | Backing up your receipt to the cloud |

### How often should I commit?

Commit whenever you finish a chunk of work you wouldn't want to lose.
That might be every 20 minutes, or after every feature you add.
More commits = more safety net. There's no such thing as too many commits.

### Good commit messages

- `"add contact form"`
- `"fix button not working on mobile"`
- `"change color scheme to dark mode"`
- `"connect to OpenAI API"`

Bad commit messages (too vague): `"stuff"`, `"changes"`, `"fix"`

### To see what you've changed before committing

```bash
git status
```

### To see your commit history

```bash
git log --oneline
```

---

## 4. Common Commands I'll Use Every Day

### Opening and navigating

| Command | What it does | When to use it |
|---------|--------------|----------------|
| `code .` | Opens VS Code in the current folder | When you're in a project folder in the terminal |
| `ls` | Lists files and folders | To see what's in the current directory |
| `cd my-folder` | Moves into a folder | To navigate to your project |
| `cd ..` | Goes up one folder level | To go back to the parent folder |
| `pwd` | Prints the current folder path | When you're lost and need to know where you are |

### Running your project

| Command | What it does | When to use it |
|---------|--------------|----------------|
| `npx live-server` | Starts a browser preview with live reload | Whenever you're working on HTML/CSS/JS |
| `node server.js` | Runs your Express server | When you need a backend running |
| `npm start` | Runs the "start" script in package.json | Shortcut for the above (if configured) |
| `Ctrl+C` | Stops whatever is running | To stop live-server or your Node server |

### npm (package manager)

| Command | What it does | When to use it |
|---------|--------------|----------------|
| `npm install` | Installs all packages listed in package.json | After cloning a project or pulling updates |
| `npm install package-name` | Installs a new package | When Claude tells you to install something |
| `npm install -g package-name` | Installs a package globally | For tools you want available everywhere |

### Git essentials

| Command | What it does | When to use it |
|---------|--------------|----------------|
| `git init` | Starts tracking a new project with Git | Once, when you create a new project |
| `git status` | Shows what's changed since your last commit | Before committing, to double-check |
| `git add .` | Stages all changes for the next commit | Right before committing |
| `git commit -m "..."` | Saves a snapshot | Whenever you finish a chunk of work |
| `git push` | Uploads commits to GitHub | After committing, to back up online |
| `git pull` | Downloads latest changes from GitHub | When working from a different computer |
| `git log --oneline` | Shows your commit history in short form | To see what you've saved |

### Python

| Command | What it does | When to use it |
|---------|--------------|----------------|
| `python3 script.py` | Runs a Python file | For automation, data processing, AI scripts |
| `python3 -m venv venv` | Creates a virtual environment | Before installing Python packages for a project |
| `source venv/bin/activate` | Activates the virtual environment (Mac/Linux) | To isolate Python packages per project |
| `pip install package-name` | Installs a Python package | When Claude tells you to install something |

---

## 5. What to Do When Something Breaks

Things will break. That's completely normal — even for professional developers. Here's the routine:

### Step 1 — Read the error message

Error messages look scary, but they usually contain the answer. Look for:
- The file name and line number where the problem occurred
- A short description of what went wrong

### Step 2 — Paste it into Claude

Copy the full error message and paste it into Claude Code. Add a sentence describing:
- What you were trying to do
- What you expected to happen
- What actually happened

**Example:**
> "I was trying to run `node server.js` and got this error. I expected the server to start but it crashed. Here's the error: [paste error]"

### Step 3 — Don't delete things randomly

If something stopped working, resist the urge to delete files or reinstall everything.
That usually makes things worse. Trust the error message and ask Claude first.

### Step 4 — Check the common causes

- Did you save the file? (Ctrl+S)
- Is your server still running? (Look at the terminal — if it returned to a `$` prompt, it stopped)
- Did you install the packages? (`npm install`)
- Is the file path correct? (Spelling matters — `Index.html` ≠ `index.html`)

### Step 5 — Use Git to undo if needed

If you made changes that broke something and want to go back:

```bash
git status           # see what changed
git diff             # see exactly what changed line by line
git checkout -- .    # UNDO all uncommitted changes (be careful — this can't be undone)
```

Or go back to a previous commit:

```bash
git log --oneline    # find the commit you want to go back to
git revert HEAD      # undo the most recent commit safely
```

---

## 6. Glossary of Terms

Plain-English definitions — one sentence each, no jargon.

| Term | What it means |
|------|---------------|
| **Repository (repo)** | A project folder that Git is tracking — it's where all your code and its history live. |
| **Branch** | A separate copy of your project you can experiment on without breaking the main version. |
| **Commit** | A saved snapshot of your project at a specific point in time, with a label you write. |
| **npm** | A tool that lets you download and use code libraries other people have written, like plugins for your project. |
| **API** | A way for two programs to talk to each other — like how a weather app asks a weather service for data. |
| **Localhost** | Your own computer, accessed through the browser — `localhost:3000` means "port 3000 on this machine." |
| **Port** | A numbered "door" on your computer that a server listens through — different apps use different port numbers to avoid conflicts. |
| **Environment variable** | A secret piece of information (like an API key) stored outside your code so it doesn't get accidentally shared. |
| **Package** | A bundle of pre-written code you can add to your project — like an app store for code building blocks. |
| **Dependency** | A package your project needs to work — listed in `package.json` so anyone can install the same ones. |
| **Terminal** | A text-based window where you type commands to control your computer directly, without clicking. |
| **Framework** | A pre-built structure for a certain type of project — like a house blueprint that handles the boring parts so you can focus on the interesting parts. |
| **Git** | A system that tracks every change you make to your code, so you can undo mistakes and collaborate with others. |
| **GitHub** | A website that stores your Git repositories online — like Google Drive but specifically for code. |
| **Node.js** | A program that lets JavaScript run outside the browser, so you can use it to build servers and scripts. |
| **Express** | A Node.js library that makes it easy to build web servers — it handles the plumbing so you can focus on your app. |
| **HTML** | The structure of a web page — it defines what elements exist (headings, paragraphs, buttons, images). |
| **CSS** | The style of a web page — it controls how elements look (colors, fonts, spacing, layout). |
| **JavaScript** | The behavior of a web page — it makes things interactive (responding to clicks, showing/hiding content, fetching data). |
| **Live reload** | A feature of live-server that automatically refreshes your browser every time you save a file, so you always see the latest version. |

---

*You are set up and ready to vibe code. Tell Claude what you want to build.*
