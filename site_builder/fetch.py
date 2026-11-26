"""Fetch every pinned source and write normalized JSON under data/.

A source that fails keeps its previous file, so one bad feed never blanks the page.
Exits non-zero only when every source fails.
Usage: python -m site_builder.fetch
"""
import datetime as dt
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

import feedparser
import requests
import yaml
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
FEEDS = DATA / "feeds"
HEADERS = {"User-Agent": "amazonoraws-fetch/1.0 (+https://amazonoraws.com)"}
TIMEOUT = 30


def plain(html, limit=280):
    text = BeautifulSoup(html or "", "html.parser").get_text(" ", strip=True)
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\s*The post .*? appeared first on .*$", "", text)
    if len(text) > limit:
        text = text[:limit].rsplit(" ", 1)[0].rstrip(",.;:") + "…"
    return text


def iso(entry):
    for key in ("published_parsed", "updated_parsed"):
        t = entry.get(key)
        if t:
            return dt.datetime(*t[:6], tzinfo=dt.timezone.utc).isoformat()
    return None


def thumbnail(entry):
    for m in entry.get("media_thumbnail") or []:
        if m.get("url"):
            return m["url"]
    return None


def clean_url(url):
    if not url:
        return url
    parts = urlsplit(url)
    if parts.netloc.endswith("aws.amazon.com") and ("trk=" in parts.query or "did=" in parts.query):
        return urlunsplit(parts._replace(query=""))
    return url


def fetch_feed(src, max_items):
    resp = requests.get(src["url"], headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    parsed = feedparser.parse(resp.content)
    if not parsed.entries:
        raise ValueError("feed has no entries")
    items = []
    for e in parsed.entries:
        link = e.get("link")
        title = plain(e.get("title"), 300)
        if not link or not title:
            continue
        items.append({
            "title": title,
            "url": link,
            "published": iso(e),
            "summary": plain(e.get("summary") or e.get("description")),
            "thumbnail": thumbnail(e),
        })
    items.sort(key=lambda i: i["published"] or "", reverse=True)
    return {"id": src["id"], "name": src["name"], "role": src["role"], "items": items[:max_items]}


def fetch_services(url):
    resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    body = resp.json()
    rows = []
    for entry in body.get("items", []):
        f = (entry.get("item") or {}).get("additionalFields") or {}
        name = (f.get("productName") or "").strip()
        if not name:
            continue
        first = name.split()[0]
        rows.append({
            "name": name,
            "prefix": first if first in ("Amazon", "AWS") else "Other",
            "summary": plain(f.get("productSummary"), 400),
            "category": (f.get("productCategory") or "Uncategorized").strip(),
            "launched": f.get("launchDate") or None,
            "url": clean_url(f.get("productUrl")),
            "free_tier": f.get("freeTierAvailability") or None,
        })
    if len(rows) < 100:
        raise ValueError(f"only {len(rows)} services returned")
    total = (body.get("metadata") or {}).get("totalHits")
    if total and total > len(body.get("items", [])):
        print(f"warning: API reports {total} services but returned {len(body['items'])}", file=sys.stderr)
    rows.sort(key=lambda r: r["name"].lower())
    return rows


def write(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=1, ensure_ascii=False) + "\n")


def main():
    cfg = yaml.safe_load((DATA / "sources.yaml").read_text())
    ok, failed = 0, []
    for src in cfg["feeds"]:
        try:
            write(FEEDS / f"{src['id']}.json", fetch_feed(src, cfg.get("max_items", 30)))
            ok += 1
            print(f"ok   {src['id']}")
        except Exception as exc:
            failed.append(src["id"])
            print(f"FAIL {src['id']}: {exc}", file=sys.stderr)
    try:
        write(DATA / "services.json", fetch_services(cfg["services"]["url"]))
        ok += 1
        print("ok   services")
    except Exception as exc:
        failed.append("services")
        print(f"FAIL services: {exc}", file=sys.stderr)
    if ok == 0:
        sys.exit("every source failed")
    if failed:
        print(f"kept previous data for: {', '.join(failed)}", file=sys.stderr)


if __name__ == "__main__":
    main()
