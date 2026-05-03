#!/usr/bin/env python3
"""
Email Follow-Up Scanner
Scans Gmail for open conversations with prospects/partners
that have had no activity for 4+ days and need a follow-up.
"""

import os
import json
import base64
import argparse
from datetime import datetime, timezone, timedelta
from email.utils import parseaddr

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# Gmail OAuth2 scopes — read-only is sufficient
SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

TOKEN_FILE = "token.json"
CREDENTIALS_FILE = "credentials.json"

# ── Configuration ────────────────────────────────────────────────────────────

# Email domains that identify AWS / GCP partners and prospects.
# Add more specific domains (e.g. "partner-company.com") as needed.
PARTNER_DOMAINS = [
    # AWS
    "amazon.com",
    "amazonaws.com",
    "aws.amazon.com",
    # GCP / Google
    "google.com",
    "googlecloud.com",
]

# Labels / keywords that suggest an active sales or partnership thread.
# Threads are matched if their subject or participants include partner domains.
FOLLOWUP_DAYS = 4  # flag threads silent for this many days


# ── Auth ─────────────────────────────────────────────────────────────────────

def get_gmail_service():
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(CREDENTIALS_FILE):
                print(
                    f"\n[ERROR] '{CREDENTIALS_FILE}' not found.\n"
                    "  1. Go to https://console.cloud.google.com/\n"
                    "  2. Create a project → Enable Gmail API\n"
                    "  3. OAuth consent screen → Desktop app credentials\n"
                    f"  4. Download and save as '{CREDENTIALS_FILE}' in this directory.\n"
                )
                raise SystemExit(1)
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(TOKEN_FILE, "w") as f:
            f.write(creds.to_json())

    return build("gmail", "v1", credentials=creds)


# ── Gmail helpers ─────────────────────────────────────────────────────────────

def get_header(headers, name):
    for h in headers:
        if h["name"].lower() == name.lower():
            return h["value"]
    return ""


def extract_addresses(header_value):
    """Return a list of (name, email) tuples from a comma-separated header."""
    parts = [p.strip() for p in header_value.split(",") if p.strip()]
    return [parseaddr(p) for p in parts]


def domain_of(email_addr):
    if "@" in email_addr:
        return email_addr.split("@", 1)[1].lower()
    return ""


def is_partner_address(email_addr):
    d = domain_of(email_addr)
    return any(d == pd or d.endswith("." + pd) for pd in PARTNER_DOMAINS)


def thread_involves_partner(messages):
    """Return True if any message in the thread includes a partner address."""
    for msg in messages:
        hdrs = msg.get("payload", {}).get("headers", [])
        for field in ("From", "To", "Cc"):
            val = get_header(hdrs, field)
            for _, addr in extract_addresses(val):
                if is_partner_address(addr):
                    return True
    return False


def last_activity(messages):
    """Return the datetime of the most recent message in the thread."""
    ts = max(int(m["internalDate"]) for m in messages)
    return datetime.fromtimestamp(ts / 1000, tz=timezone.utc)


def last_message_was_mine(messages, my_email):
    """Return True if *I* sent the last message in the thread (I need a reply, not a follow-up)."""
    latest = max(messages, key=lambda m: int(m["internalDate"]))
    hdrs = latest.get("payload", {}).get("headers", [])
    from_addr = get_header(hdrs, "From")
    _, addr = parseaddr(from_addr)
    return addr.lower() == my_email.lower()


def get_snippet_and_subject(messages):
    latest = max(messages, key=lambda m: int(m["internalDate"]))
    hdrs = latest.get("payload", {}).get("headers", [])
    subject = get_header(hdrs, "Subject") or "(no subject)"
    snippet = latest.get("snippet", "")
    return subject, snippet


def get_partner_contacts(messages):
    """Collect unique partner email addresses across the thread."""
    contacts = set()
    for msg in messages:
        hdrs = msg.get("payload", {}).get("headers", [])
        for field in ("From", "To", "Cc"):
            val = get_header(hdrs, field)
            for name, addr in extract_addresses(val):
                if is_partner_address(addr):
                    label = f"{name} <{addr}>" if name else addr
                    contacts.add(label)
    return sorted(contacts)


# ── Core scan ─────────────────────────────────────────────────────────────────

def scan(service, my_email, days=FOLLOWUP_DAYS, limit=200, verbose=False):
    cutoff = datetime.now(tz=timezone.utc) - timedelta(days=days)

    # Search for threads that have messages from partner domains in the last 90
    # days so we don't trawl the entire mailbox.  We'll filter more precisely below.
    domain_query = " OR ".join(f"from:{d} OR to:{d}" for d in PARTNER_DOMAINS)
    query = f"({domain_query}) newer_than:90d"

    if verbose:
        print(f"[+] Gmail query: {query}\n")

    stale_threads = []
    page_token = None
    fetched = 0

    while fetched < limit:
        params = {"userId": "me", "q": query, "maxResults": min(50, limit - fetched)}
        if page_token:
            params["pageToken"] = page_token

        resp = service.users().threads().list(**params).execute()
        thread_stubs = resp.get("threads", [])
        if not thread_stubs:
            break

        for stub in thread_stubs:
            fetched += 1
            thread = (
                service.users()
                .threads()
                .get(userId="me", id=stub["id"], format="metadata",
                     metadataHeaders=["From", "To", "Cc", "Subject", "Date"])
                .execute()
            )
            messages = thread.get("messages", [])
            if not messages:
                continue

            activity = last_activity(messages)
            days_silent = (datetime.now(tz=timezone.utc) - activity).days

            if days_silent < days:
                continue  # still active

            if not thread_involves_partner(messages):
                continue  # not a partner thread

            # Skip if I haven't yet replied (they're waiting on them, not me).
            # Comment this block out if you want ALL stale threads regardless.
            if not last_message_was_mine(messages, my_email):
                continue

            subject, snippet = get_snippet_and_subject(messages)
            contacts = get_partner_contacts(messages)

            stale_threads.append({
                "thread_id": stub["id"],
                "subject": subject,
                "days_silent": days_silent,
                "last_activity": activity,
                "contacts": contacts,
                "snippet": snippet,
                "message_count": len(messages),
            })

        page_token = resp.get("nextPageToken")
        if not page_token:
            break

    stale_threads.sort(key=lambda t: t["days_silent"], reverse=True)
    return stale_threads


# ── Output ────────────────────────────────────────────────────────────────────

def print_report(threads, days):
    now = datetime.now(tz=timezone.utc)
    print("\n" + "=" * 70)
    print(f"  EMAIL FOLLOW-UP SCANNER  |  {now.strftime('%Y-%m-%d %H:%M UTC')}")
    print(f"  Threads silent for {days}+ days with AWS / GCP contacts")
    print("=" * 70)

    if not threads:
        print(f"\n  No stale threads found. You're all caught up!\n")
        return

    for i, t in enumerate(threads, 1):
        age = t["days_silent"]
        urgency = "!!! URGENT" if age >= 14 else ("!! OVERDUE" if age >= 7 else "! FOLLOW UP")
        print(f"\n[{i}] {urgency}  —  {age} days silent")
        print(f"    Subject : {t['subject']}")
        print(f"    Contact : {', '.join(t['contacts']) or 'unknown'}")
        print(f"    Last msg: {t['last_activity'].strftime('%Y-%m-%d %H:%M UTC')}  ({t['message_count']} messages)")
        print(f"    Snippet : {t['snippet'][:120]}{'…' if len(t['snippet']) > 120 else ''}")
        print(f"    Link    : https://mail.google.com/mail/#all/{t['thread_id']}")

    print(f"\n{'=' * 70}")
    print(f"  {len(threads)} thread(s) need your attention.\n")


def export_json(threads, path="followup_report.json"):
    output = []
    for t in threads:
        output.append({
            **t,
            "last_activity": t["last_activity"].isoformat(),
            "gmail_link": f"https://mail.google.com/mail/#all/{t['thread_id']}",
        })
    with open(path, "w") as f:
        json.dump(output, f, indent=2)
    print(f"[+] JSON report saved to {path}")


# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Scan Gmail for stale partner/prospect threads that need a follow-up."
    )
    parser.add_argument(
        "--days", type=int, default=FOLLOWUP_DAYS,
        help=f"Days of silence before flagging a thread (default: {FOLLOWUP_DAYS})"
    )
    parser.add_argument(
        "--limit", type=int, default=200,
        help="Maximum number of threads to scan (default: 200)"
    )
    parser.add_argument(
        "--json", action="store_true",
        help="Also export results to followup_report.json"
    )
    parser.add_argument(
        "--verbose", action="store_true",
        help="Print debug info"
    )
    args = parser.parse_args()

    service = get_gmail_service()

    # Fetch the authenticated user's email address
    profile = service.users().getProfile(userId="me").execute()
    my_email = profile["emailAddress"]
    if args.verbose:
        print(f"[+] Authenticated as: {my_email}")

    print(f"[+] Scanning threads (limit={args.limit}, silence_threshold={args.days}d)…")
    threads = scan(service, my_email, days=args.days, limit=args.limit, verbose=args.verbose)

    print_report(threads, args.days)

    if args.json:
        export_json(threads)


if __name__ == "__main__":
    main()
