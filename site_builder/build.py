"""Render data/ into dist/. Same data in, same bytes out.

Usage: python -m site_builder.build
"""
import datetime as dt
import json
import shutil
from collections import Counter, defaultdict
from itertools import groupby
from pathlib import Path

import yaml
from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
DIST = ROOT / "dist"
TEMPLATES = ROOT / "templates"
STATIC = ["CNAME", "robots.txt"]


def parse_time(value):
    return dt.datetime.fromisoformat(value) if value else None


def short_date(value):
    t = parse_time(value)
    return f"{t:%b} {t.day}" if t else ""


def day_label(value):
    t = parse_time(value)
    return f"{t:%A}, {t:%B} {t.day}" if t else "Undated"


def load_feeds(cfg):
    feeds = {}
    for src in cfg["feeds"]:
        path = DATA / "feeds" / f"{src['id']}.json"
        if path.exists():
            feeds[src["id"]] = json.loads(path.read_text())
    return feeds


def river(cfg, feeds):
    items = []
    for src in cfg["feeds"]:
        if src["role"] != "river" or src["id"] not in feeds:
            continue
        for it in feeds[src["id"]]["items"]:
            items.append({**it, "source_id": src["id"], "source": src["name"]})
    items.sort(key=lambda i: i["published"] or "", reverse=True)
    items = items[:60]
    days = []
    for key, group in groupby(items, key=lambda i: (i["published"] or "")[:10]):
        group = list(group)
        days.append({"label": day_label(group[0]["published"]), "date": key, "items": group})
    return days


def by_role(cfg, feeds, role):
    for src in cfg["feeds"]:
        if src["role"] == role and src["id"] in feeds:
            return feeds[src["id"]]
    return None


def year_chart(services):
    counts = defaultdict(Counter)
    for s in services:
        if s["launched"]:
            counts[int(s["launched"][:4])][s["prefix"]] += 1
    if not counts:
        return None
    years = list(range(min(counts), max(counts) + 1))
    peak = max(sum(counts[y].values()) for y in years)
    width, height, pad_b, pad_t = 760, 230, 26, 20
    slot = width / len(years)
    bar = slot * 0.66
    scale = (height - pad_b - pad_t) / peak
    bars = []
    for i, y in enumerate(years):
        x = i * slot + (slot - bar) / 2
        base = height - pad_b
        segs = []
        for prefix in ("Amazon", "AWS", "Other"):
            n = counts[y][prefix]
            if not n:
                continue
            h = n * scale
            base -= h
            segs.append({"prefix": prefix, "n": n, "y": round(base, 2), "h": round(h, 2)})
        total = sum(counts[y].values())
        bars.append({
            "year": y, "x": round(x, 2), "w": round(bar, 2), "segs": segs, "total": total, "top": round(base, 2),
            "label": y % 2 == 0 or len(years) <= 12,
            "title": f"{y}: {total} launched ({counts[y]['Amazon']} Amazon, {counts[y]['AWS']} AWS, {counts[y]['Other']} other)",
        })
    return {"width": width, "height": height, "label_y": height - 8, "bars": bars, "peak": peak}


def services_context(services):
    counts = Counter(s["prefix"] for s in services)
    total = len(services)
    split = [
        {"prefix": p, "n": counts[p], "pct": round(100 * counts[p] / total, 1)}
        for p in ("Amazon", "AWS", "Other") if counts[p]
    ]
    for s in services:
        name = s["name"]
        if s["prefix"] in ("Amazon", "AWS"):
            s["head"], s["rest"] = s["prefix"], name[len(s["prefix"]):]
        else:
            s["head"], s["rest"] = "", name
        s["year"] = s["launched"][:4] if s["launched"] else ""
    categories = sorted({s["category"] for s in services})
    return {"services": services, "split": split, "total": total, "counts": counts,
            "categories": categories, "chart": year_chart(services)}


def main():
    cfg = yaml.safe_load((DATA / "sources.yaml").read_text())
    feeds = load_feeds(cfg)
    services = json.loads((DATA / "services.json").read_text())

    newest = max((i["published"] for f in feeds.values() for i in f["items"] if i["published"]), default=None)
    env = Environment(loader=FileSystemLoader(TEMPLATES), autoescape=select_autoescape(["html", "j2"]),
                      trim_blocks=True, lstrip_blocks=True)
    env.filters["short_date"] = short_date
    common = {
        "css": (TEMPLATES / "styles.css").read_text(),
        "js": (TEMPLATES / "app.js").read_text(),
        "updated": short_date(newest),
        "updated_iso": newest or "",
    }
    river_sources = [s for s in cfg["feeds"] if s["role"] == "river" and s["id"] in feeds]

    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()
    (DIST / "index.html").write_text(env.get_template("news.html.j2").render(
        **common, page="news", days=river(cfg, feeds), sources=river_sources,
        launches=by_role(cfg, feeds, "launches"), videos=by_role(cfg, feeds, "videos"),
    ))
    (DIST / "amazon-or-aws.html").write_text(env.get_template("services.html.j2").render(
        **common, page="services", **services_context(services),
    ))
    for name in STATIC:
        if (ROOT / name).exists():
            shutil.copy(ROOT / name, DIST / name)
    print(f"built {DIST}")


if __name__ == "__main__":
    main()
