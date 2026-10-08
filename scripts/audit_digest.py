#!/usr/bin/env python3
"""Daily SignalFlow activity digest — emails everything in audit.json since last run.
Run via cron. State file tracks the last-seen entry id to avoid duplicates."""
import json, os, urllib.request

DATA = "/var/lib/docker/volumes/signalflow_signalflow_data/_data"
AUDIT = os.path.join(DATA, "audit.json")
STATE = os.path.expanduser("~/.signalflow_digest_state")
INBOX = "jarvis0772@agentmail.to"
TO = "cphifer3@gmail.com"
KEY = os.environ.get("AGENTMAIL_API_KEY", "")

# API key from signalflow .env if not in env
if not KEY:
    try:
        with open("/root/signalflow/.env") as f:
            for line in f:
                if line.startswith("AGENTMAIL_API_KEY="):
                    KEY = line.strip().split("=", 1)[1]
    except OSError:
        pass

entries = []
if os.path.exists(AUDIT):
    with open(AUDIT) as f:
        entries = json.load(f)

last_id = ""
if os.path.exists(STATE):
    with open(STATE) as f:
        last_id = f.read().strip()

# entries are newest-first; take everything newer than last_id
new_entries = []
for e in entries:
    if e.get("id") == last_id:
        break
    new_entries.append(e)
new_entries.reverse()  # chronological

if not new_entries:
    print("No new audit entries.")
    raise SystemExit(0)

lines = [f"SignalFlow activity digest — {len(new_entries)} event(s) since last report", ""]
for e in new_entries:
    at = e.get("at", "?").replace("T", " ")[:19] + " UTC"
    who = e.get("user") or e.get("username") or "?"
    action = e.get("action", "?")
    target = e.get("target") or ""
    extra = {k: v for k, v in e.items()
             if k not in ("id", "at", "user", "username", "ip", "action", "target", "silent") and v not in (None, "", [], {})}
    line = f"{at}  {who} ({e.get('ip','?')})  {action}  {target}"
    if extra:
        line += f"  {json.dumps(extra)[:200]}"
    lines.append(line)

body = "\n".join(lines)
subject = f"SignalFlow daily digest — {len(new_entries)} events"

req = urllib.request.Request(
    f"https://api.agentmail.to/v0/inboxes/{INBOX}/messages/send",
    data=json.dumps({"to": [TO], "subject": subject, "text": body}).encode(),
    headers={"Content-Type": "application/json", "Authorization": f"Bearer {KEY}"},
    method="POST",
)
try:
    with urllib.request.urlopen(req, timeout=15) as r:
        ok = r.status in (200, 201)
except Exception as err:
    print(f"Email send failed: {err}")
    raise SystemExit(1)

if ok:
    newest = entries[0].get("id", "")
    with open(STATE, "w") as f:
        f.write(newest)
    print(f"Digest sent: {len(new_entries)} events.")
else:
    print("Email send returned non-OK.")
    raise SystemExit(1)
