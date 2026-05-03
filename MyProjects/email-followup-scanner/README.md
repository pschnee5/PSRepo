# Email Follow-Up Scanner

Scans your Gmail for open conversations with AWS and GCP prospects/partners
that have gone **4+ days without activity** — so nothing falls through the cracks.

## How it works

1. Searches your last 90 days of email for threads involving AWS (`amazon.com`) or GCP (`google.com`) contacts.
2. Finds threads where **you sent the last message** (i.e., the ball is in their court — but you haven't heard back).
3. Flags any thread silent for 4+ days as needing a follow-up.
4. Prints a prioritized report with direct Gmail links.

> To also catch threads where **they** last replied but you haven't responded, remove the `last_message_was_mine` filter in `scanner.py` (see comment in `scan()`).

---

## Setup

### 1. Enable the Gmail API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Navigate to **APIs & Services → Library** → search for **Gmail API** → Enable it
4. Go to **APIs & Services → OAuth consent screen**
   - Choose **External**, fill in app name (e.g. "Email Scanner"), save
5. Go to **APIs & Services → Credentials**
   - Click **Create Credentials → OAuth client ID**
   - Application type: **Desktop app**
   - Download the JSON and save it as `credentials.json` in this directory

### 2. Install dependencies

```bash
cd MyProjects/email-followup-scanner
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Run

```bash
python scanner.py
```

The first run opens a browser for Google OAuth. After authorizing, a `token.json` is saved
locally so future runs are silent.

---

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--days N` | `4` | Flag threads silent for N+ days |
| `--limit N` | `200` | Max threads to scan |
| `--json` | off | Save results to `followup_report.json` |
| `--verbose` | off | Print debug info |

### Examples

```bash
# Flag threads silent 7+ days, save JSON
python scanner.py --days 7 --json

# Quick scan of last 100 threads
python scanner.py --limit 100

# Verbose mode
python scanner.py --verbose
```

---

## Adding more partner domains

Edit the `PARTNER_DOMAINS` list in `scanner.py`:

```python
PARTNER_DOMAINS = [
    "amazon.com",
    "amazonaws.com",
    "google.com",
    "googlecloud.com",
    # add your prospect domains here:
    "prospect-company.com",
    "another-partner.io",
]
```

---

## Automate with cron (optional)

To run every weekday morning at 8 AM and email yourself the JSON report:

```cron
0 8 * * 1-5 /path/to/venv/bin/python /path/to/scanner.py --json >> /tmp/scanner.log 2>&1
```

---

## Security notes

- `credentials.json` and `token.json` are in `.gitignore` — **never commit them**.
- The app requests **read-only** Gmail access (`gmail.readonly` scope).
- Tokens are stored locally; Google can revoke them at any time from your [account security page](https://myaccount.google.com/permissions).
