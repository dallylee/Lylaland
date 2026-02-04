#!/usr/bin/env python3
"""
Convert trending CSV into src/content/media_amazon_trending.json

CSV expected columns (extra columns are ignored):
rank,title,author,format,price_gbp,rating,review_count,product_url,image_url,description

Output JSON shape:
{
  "source": "...",
  "lastUpdated": "ISO-UTC",
  "items": [
     {"id":"amz:<stableKey>", "rank":1, "title":"...", ...}
  ]
}
"""
import argparse
import csv
import hashlib
import json
from datetime import datetime, timezone
import re

ASIN_RE = re.compile(r"/dp/([A-Z0-9]{10})|/gp/product/([A-Z0-9]{10})", re.IGNORECASE)

def stable_key_from_url(url: str) -> str:
    if not url:
        return hashlib.sha256(b"missing-url").hexdigest()[:16]
    m = ASIN_RE.search(url)
    if m:
        asin = next(g for g in m.groups() if g)
        return asin.upper()
    return hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]

def to_int(x):
    try:
        return int(str(x).replace(",", "").strip())
    except Exception:
        return None

def to_float(x):
    try:
        return float(str(x).strip())
    except Exception:
        return None

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="inp", required=True, help="Input CSV path")
    ap.add_argument("--out", dest="out", required=True, help="Output JSON path")
    ap.add_argument("--source", default="amazon_new_releases_books_69")
    args = ap.parse_args()

    items = []
    with open(args.inp, newline="", encoding="utf-8") as f:
        r = csv.DictReader(f)
        for row in r:
            url = (row.get("product_url") or "").strip()
            key = stable_key_from_url(url)
            items.append({
                "id": f"amz:{key}",
                "stableKey": key,
                "rank": to_int(row.get("rank")),
                "title": (row.get("title") or "").strip(),
                "author": (row.get("author") or "").strip() or None,
                "format": (row.get("format") or "").strip() or None,
                "priceGbp": (row.get("price_gbp") or "").strip() or None,
                "rating": to_float(row.get("rating")),
                "reviewCount": to_int(row.get("review_count")),
                "amazonUrl": url or None,
                "imageUrl": (row.get("image_url") or "").strip() or None,
                "description": (row.get("description") or "").strip() or None,
            })

    payload = {
        "source": args.source,
        "lastUpdated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "items": items
    }

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(items)} items to {args.out}")

if __name__ == "__main__":
    main()
