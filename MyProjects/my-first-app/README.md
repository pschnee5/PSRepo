# my-first-app

This is my first vibe coding project. It's a simple web app built with plain
HTML, CSS, and JavaScript — no frameworks required.

## What's in this folder

| File         | What it does                                           |
|--------------|--------------------------------------------------------|
| `index.html` | The structure of the page — what appears in the browser |
| `styles.css` | How the page looks — colors, fonts, spacing            |
| `script.js`  | What the page does — clicks, animations, logic         |
| `server.js`  | A tiny server (Node.js / Express) that runs on port 3000 |
| `.env`       | Secret keys and settings (never share this file!)      |
| `.gitignore` | Tells Git which files to ignore                        |

## How to open the project in your browser

```bash
npx live-server
```

Then visit **http://127.0.0.1:8080** in your browser.

## How to run the Express server

```bash
node server.js
```

Then visit **http://localhost:3000** in your browser.

## How to save your work with Git

```bash
git add .
git commit -m "describe what you changed"
git push
```

## Built with

- HTML5
- CSS3
- JavaScript (vanilla)
- Node.js + Express (for the server)
