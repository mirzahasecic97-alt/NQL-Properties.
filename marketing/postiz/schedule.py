#!/usr/bin/env python3
"""Schedule the November winter push in Postiz from marketing/postiz/plan.json.

Needs only Python 3.9 and the key in ~/.config/nql/postiz.env:
    POSTIZ_API_KEY=...
    POSTIZ_API_URL=https://api.postiz.com/public/v1   (optional; set for a self-hosted Postiz)

Commands (run from anywhere):
    python3 marketing/postiz/schedule.py channels           list the connected channels and how they map
    python3 marketing/postiz/schedule.py plan               show every post with its UTC time
    python3 marketing/postiz/schedule.py schedule --dry-run show the exact payloads, send nothing
    python3 marketing/postiz/schedule.py schedule           upload the images once, then create the posts
    python3 marketing/postiz/schedule.py schedule --draft   same, but as drafts to approve in the Postiz calendar
    python3 marketing/postiz/schedule.py list               what Postiz holds for November
    python3 marketing/postiz/schedule.py delete             remove every post this script created (from scheduled.json)
"""
import json, mimetypes, os, sys, time, uuid, urllib.request, urllib.error
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

HERE = Path(__file__).resolve().parent
PLAN = HERE / "plan.json"
UPLOADS = HERE / "uploads.json"       # image file -> {id, path}, so each image is uploaded once
SCHEDULED = HERE / "scheduled.json"   # what was created, for `list` and `delete`
IMAGES = HERE.parent / "stories" / "out" / "jpg"   # Instagram wants JPEG, 1080 wide
ENV = Path.home() / ".config" / "nql" / "postiz.env"

# Postiz provider identifiers for each channel in the plan, in order of preference.
CHANNELS = {
    "instagram": ["instagram", "instagram-standalone"],
    "facebook": ["facebook"],
    "linkedin": ["linkedin-page", "linkedin"],
}


def env():
    conf = {}
    if ENV.exists():
        for line in ENV.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                conf[k.strip()] = v.strip().strip('"').strip("'")
    key = os.environ.get("POSTIZ_API_KEY") or conf.get("POSTIZ_API_KEY")
    if not key:
        sys.exit(f"No API key. Put POSTIZ_API_KEY=... in {ENV} (Postiz: Settings > Developers > Your API key).")
    url = os.environ.get("POSTIZ_API_URL") or conf.get("POSTIZ_API_URL") or "https://api.postiz.com/public/v1"
    return key, url.rstrip("/")


def call(method, path, body=None, files=None, retries=3):
    key, base = env()
    url = base + path
    headers = {"Authorization": key, "Accept": "application/json"}
    data = None
    if files:
        boundary = "----nql" + uuid.uuid4().hex
        parts = []
        for field, filepath in files.items():
            p = Path(filepath)
            ctype = mimetypes.guess_type(p.name)[0] or "application/octet-stream"
            parts.append(
                f"--{boundary}\r\nContent-Disposition: form-data; name=\"{field}\"; filename=\"{p.name}\"\r\n"
                f"Content-Type: {ctype}\r\n\r\n".encode() + p.read_bytes() + b"\r\n"
            )
        data = b"".join(parts) + f"--{boundary}--\r\n".encode()
        headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
    elif body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                raw = r.read().decode() or "null"
                return json.loads(raw)
        except urllib.error.HTTPError as e:
            text = e.read().decode(errors="replace")
            if e.code >= 500 and attempt < retries - 1:
                time.sleep(2 ** attempt)
                continue
            if e.code == 429:
                sys.exit("Postiz rate limit (100 create-post calls an hour). Wait an hour and run again; uploads are cached.")
            sys.exit(f"{method} {path} -> HTTP {e.code}: {text[:600]}")
    return None


def load_plan():
    return json.loads(PLAN.read_text())


def utc_iso(when, zone):
    local = datetime.strptime(when, "%Y-%m-%d %H:%M").replace(tzinfo=ZoneInfo(zone))
    return local.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")


def channels():
    found = call("GET", "/integrations") or []
    mapping = {}
    for name, ids in CHANNELS.items():
        for ident in ids:
            hit = next((i for i in found if i.get("identifier") == ident and not i.get("disabled")), None)
            if hit:
                mapping[name] = hit
                break
    return found, mapping


def settings_for(channel, kind, integration):
    ident = integration["identifier"]
    if channel == "instagram":
        return {"__type": ident, "post_type": "story" if kind == "story" else "post"}
    if channel == "facebook":
        return {"__type": "facebook", "post_type": "story" if kind == "story" else "post"}
    if channel == "linkedin":
        return {"__type": ident, "post_as_images_carousel": False}
    raise SystemExit(f"unknown channel {channel}")


def upload(image, dry):
    cache = json.loads(UPLOADS.read_text()) if UPLOADS.exists() else {}
    if image in cache:
        return cache[image]
    path = IMAGES / image
    if not path.exists():
        sys.exit(f"missing image {path}")
    if dry:
        return {"id": f"dry-{image}", "path": f"dry://{image}"}
    res = call("POST", "/upload", files={"file": path})
    cache[image] = {"id": res["id"], "path": res["path"]}
    UPLOADS.write_text(json.dumps(cache, indent=2))
    print(f"  uploaded {image} -> {res['id']}")
    return cache[image]


def build(slot, plan, mapping, dry):
    posts = []
    skipped = []
    for p in slot["posts"]:
        integ = mapping.get(p["channel"])
        if not integ:
            skipped.append(p["channel"])
            continue
        media = upload(p["image"], dry)
        content = plan["captions"][p["caption"]] if p.get("caption") else ""
        posts.append({
            "integration": {"id": integ["id"]},
            "value": [{"content": content, "image": [{"id": media["id"], "path": media["path"]}]}],
            "settings": settings_for(p["channel"], p["kind"], integ),
        })
    return posts, skipped


def cmd_channels():
    found, mapping = channels()
    print("Connected in Postiz:")
    for i in found:
        flag = " (disabled)" if i.get("disabled") else ""
        print(f"  {i.get('identifier'):22} {i.get('name')} @{i.get('profile')}{flag}  id={i.get('id')}")
    print("\nThe plan will post to:")
    for name in CHANNELS:
        hit = mapping.get(name)
        print(f"  {name:10} -> {hit['identifier'] + ' ' + hit['name'] if hit else 'NOT CONNECTED, its posts will be skipped'}")


def cmd_plan():
    plan = load_plan()
    for s in plan["slots"]:
        print(f"{s['key']}: {s['when']} {s['zone']} = {utc_iso(s['when'], s['zone'])}")
        for p in s["posts"]:
            print(f"    {p['channel']:10} {p['kind']:6} {p['image']}  caption={p.get('caption','(none, story)')}")


def cmd_schedule(dry=False, draft=False):
    plan = load_plan()
    if dry and not (os.environ.get("POSTIZ_API_KEY") or ENV.exists()):
        mapping = {n: {"id": f"dry-{n}", "identifier": ids[0], "name": "(no key, pretend channel)"} for n, ids in CHANNELS.items()}
    else:
        _, mapping = channels()
    if not mapping:
        sys.exit("No usable channels connected in Postiz. Connect Instagram, Facebook and LinkedIn first.")
    done = json.loads(SCHEDULED.read_text()) if SCHEDULED.exists() else {}
    now = datetime.now(timezone.utc)
    for s in plan["slots"]:
        if s["key"] in done:
            print(f"{s['key']}: already created, skipping")
            continue
        date = utc_iso(s["when"], s["zone"])
        if datetime.strptime(date, "%Y-%m-%dT%H:%M:%S.000Z").replace(tzinfo=timezone.utc) < now:
            print(f"{s['key']}: {date} is in the past, skipping")
            continue
        posts, skipped = build(s, plan, mapping, dry)
        if skipped:
            print(f"{s['key']}: no channel for {', '.join(skipped)}, those posts skipped")
        if not posts:
            continue
        body = {"type": "draft" if draft else "schedule", "date": date, "shortLink": False, "tags": [], "posts": posts}
        if dry:
            print(f"\n{s['key']} -> POST /posts")
            print(json.dumps(body, indent=2, ensure_ascii=False))
            continue
        res = call("POST", "/posts", body=body)
        done[s["key"]] = {"date": date, "result": res}
        SCHEDULED.write_text(json.dumps(done, indent=2))
        print(f"{s['key']}: created {len(posts)} post(s) for {date} ({'draft' if draft else 'scheduled'})")
    if dry:
        print("\nDry run: nothing was sent.")


def cmd_list():
    res = call("GET", "/posts?startDate=2026-11-01T00:00:00.000Z&endDate=2026-11-30T23:59:59.000Z")
    posts = res.get("posts", res) if isinstance(res, dict) else res
    for p in posts or []:
        integ = p.get("integration", {})
        print(f"{p.get('publishDate')}  {p.get('state'):9} {integ.get('providerIdentifier') or integ.get('identifier'):20} {p.get('id')}  {(p.get('content') or '')[:60]!r}")
        if p.get("error"):
            print(f"    error: {p['error']}")
    if not posts:
        print("Nothing in Postiz for November.")


def cmd_delete():
    if not SCHEDULED.exists():
        sys.exit("scheduled.json not found; nothing was created by this script.")
    done = json.loads(SCHEDULED.read_text())
    for key, entry in list(done.items()):
        for item in entry.get("result") or []:
            pid = item.get("postId")
            if pid:
                call("DELETE", f"/posts/{pid}")
                print(f"{key}: deleted {pid}")
        done.pop(key)
        SCHEDULED.write_text(json.dumps(done, indent=2))


if __name__ == "__main__":
    args = sys.argv[1:]
    cmd = args[0] if args else "plan"
    if cmd == "channels":
        cmd_channels()
    elif cmd == "plan":
        cmd_plan()
    elif cmd == "schedule":
        cmd_schedule(dry="--dry-run" in args, draft="--draft" in args)
    elif cmd == "list":
        cmd_list()
    elif cmd == "delete":
        cmd_delete()
    else:
        print(__doc__)
