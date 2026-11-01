#!/usr/bin/env python3
"""Schedule one post in Postiz outside the plan.

    python3 marketing/postiz/post_once.py --channel instagram --kind post \
        --file path/to/video.mp4 --when "2026-11-02 08:00" --zone Europe/Oslo \
        --caption-file caption.txt [--dry-run]

kind: post (feed; a 9:16 video becomes a Reel) or story. Channels and the key
come from schedule.py (same env file). Prints the Postiz response.
"""
import argparse, json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import schedule as S

ap = argparse.ArgumentParser()
ap.add_argument("--channel", required=True, choices=list(S.CHANNELS))
ap.add_argument("--kind", default="post", choices=["post", "story"])
ap.add_argument("--file", required=True)
ap.add_argument("--when", required=True, help="YYYY-MM-DD HH:MM local to --zone")
ap.add_argument("--zone", default="Europe/Oslo")
ap.add_argument("--caption", default="")
ap.add_argument("--caption-file")
ap.add_argument("--dry-run", action="store_true")
a = ap.parse_args()

caption = Path(a.caption_file).read_text().strip() if a.caption_file else a.caption
if a.kind == "story":
    caption = ""
date = S.utc_iso(a.when, a.zone)
_, mapping = S.channels()
integ = mapping.get(a.channel)
if not integ:
    sys.exit(f"{a.channel} is not connected in Postiz")
print(f"to {integ['identifier']} {integ['name']} at {date} ({a.when} {a.zone})")
if a.dry_run:
    print("dry run, nothing uploaded"); sys.exit(0)
media = S.call("POST", "/upload", files={"file": Path(a.file)})
print("uploaded:", media)
body = {"type": "schedule", "date": date, "shortLink": False, "tags": [], "posts": [{
    "integration": {"id": integ["id"]},
    "value": [{"content": caption, "image": [{"id": media["id"], "path": media["path"]}]}],
    "settings": S.settings_for(a.channel, a.kind, integ),
}]}
res = S.call("POST", "/posts", body=body)
print("created:", json.dumps(res))
log = Path(__file__).resolve().parent / "once.json"
entries = json.loads(log.read_text()) if log.exists() else []
entries.append({"file": a.file, "date": date, "channel": a.channel, "kind": a.kind, "result": res})
log.write_text(json.dumps(entries, indent=2))
