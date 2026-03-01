# LinkedIn Priority Analyzer

Paste in a LinkedIn profile URL and get back that person's **top 3 professional priorities**, grounded in their actual profile — powered by Claude AI.

## Setup (one time only)

1. **Get an Anthropic API key**
   Go to [console.anthropic.com](https://console.anthropic.com), sign up, and create a key.

2. **Add your key to `.env`**
   Open the `.env` file in this folder and replace `your-anthropic-key-here` with your key.

3. **Install dependencies** (already done if you ran setup)
   ```bash
   npm install
   ```

## How to use it

### Option A — Automatic (URL mode)
```bash
node analyze.js https://www.linkedin.com/in/their-profile/
```
The script will try to fetch the profile automatically. If LinkedIn blocks it
(login wall), it will ask for your session cookie or let you paste the text.

### Option B — Paste mode (always works)
```bash
node analyze.js
```
No URL needed. The script will ask you to paste the profile text directly.

---

## Getting your LinkedIn session cookie (for Option A)

If LinkedIn shows a login wall, you can give the script your own session
so it can read the full profile — just like you would in the browser.

1. Log into LinkedIn in Chrome
2. Press **F12** to open DevTools
3. Go to **Application → Storage → Cookies → https://www.linkedin.com**
4. Find the cookie named **`li_at`** and copy its value
5. Paste it when the script asks

> Your cookie is never stored anywhere except your own `.env` file if you choose.

---

## What it tells you

```
PERSON: Jane Smith — VP of Product, Acme Corp

PRIORITY 1: Scaling AI-Driven Products to Enterprise
WHY: Jane has led three consecutive product launches targeting Fortune 500 ...

PRIORITY 2: Building High-Autonomy Engineering Teams
WHY: Her last four roles all involved growing 0→1 teams ...

PRIORITY 3: Open Source Community Leadership
WHY: She maintains two widely-used OSS tools and speaks at ...

CONVERSATION STARTER: I noticed you transitioned from ...
```

---

## Cost

Each analysis uses Claude Haiku — the fastest and cheapest Claude model.
A single profile analysis costs less than $0.01.
