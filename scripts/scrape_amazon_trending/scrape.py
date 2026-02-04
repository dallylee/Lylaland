import argparse
import csv
import os
import re
import sys
import time
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

SCRAPERAPI_ENDPOINT = "https://api.scraperapi.com/"
AMAZON_BASE = "https://www.amazon.co.uk"


IMG_LINK_RE = re.compile(r"\[!\[(?P<alt>.*?)\]\((?P<img>.*?)\)\]\((?P<href>.*?)\)")
LINK_RE = re.compile(r"^\[(?P<text>.+?)\]\((?P<href>.+?)\)$")
STARS_RE = re.compile(r"(\d(?:\.\d)?) out of 5 stars", re.IGNORECASE)

FORMAT_SET = {
    "hardcover",
    "paperback",
    "kindle edition",
    "audible audiobook",
    "board book",
}


def normalise_url(u: str) -> str | None:
    if not u:
        return None
    u = u.strip()
    if u.startswith("//"):
        return "https:" + u
    if u.startswith("http://") or u.startswith("https://"):
        return u
    return urljoin(AMAZON_BASE, u)


def scraperapi_get(
    api_key: str,
    target_url: str,
    *,
    output_format: str | None = "markdown",
    country_code: str | None = "uk",
    device_type: str | None = "desktop",
    render: bool = False,
    session_number: int | None = 1,
    timeout_s: int = 60,
    retries: int = 3,
) -> str:
    params = {"api_key": api_key, "url": target_url}

    # ScraperAPI supports output_format=markdown/text (HTML is default if omitted)
    if output_format:
        params["output_format"] = output_format

    # Optional tuning parameters (do not increase cost unless you enable render/premium features)
    if country_code:
        params["country_code"] = country_code
    if device_type:
        params["device_type"] = device_type
    if render:
        params["render"] = "true"
    if session_number is not None:
        params["session_number"] = str(session_number)

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept-Language": "en-GB,en;q=0.9",
    }

    last_err = None
    for attempt in range(1, retries + 1):
        try:
            r = requests.get(SCRAPERAPI_ENDPOINT, params=params, headers=headers, timeout=timeout_s)
            r.raise_for_status()
            return r.text
        except Exception as e:
            last_err = e
            if attempt < retries:
                time.sleep(1.5 * attempt)
            else:
                raise RuntimeError(f"ScraperAPI request failed after {retries} attempts: {e}") from e

    raise RuntimeError(f"ScraperAPI request failed: {last_err}")


def extract_section(markdown: str, heading: str) -> str:
    # Prefer the exact H1 heading
    idx = markdown.find(f"# {heading}")
    if idx == -1:
        # fallback: find the heading text anywhere
        idx = markdown.find(heading)
    if idx == -1:
        raise ValueError(f"Could not find section heading: {heading}")

    # Stop before pagination block if present
    m_end = re.search(r"\n\* ←Previous page", markdown[idx:])
    end_idx = idx + m_end.start() if m_end else len(markdown)
    return markdown[idx:end_idx]


def split_book_blocks(section_md: str) -> list[list[str]]:
    # Each item on your page is preceded by lines like: "1. #1"
    blocks = re.split(r"(?m)^\d+\.\s+#\d+\s*$", section_md)
    out = []
    for b in blocks[1:]:
        lines = [ln.strip() for ln in b.splitlines() if ln.strip()]
        if lines:
            out.append(lines)
    return out


def parse_book_block(lines: list[str], rank: int) -> dict:
    data = {
        "rank": rank,
        "title": None,
        "author": None,
        "format": None,
        "price_gbp": None,
        "product_url": None,
        "image_url": None,
        "rating": None,
        "review_count": None,
        "description": None,
    }

    for ln in lines:
        ln = ln.strip()

        m_img = IMG_LINK_RE.search(ln)
        if m_img and not data["image_url"]:
            data["image_url"] = normalise_url(m_img.group("img"))
            data["product_url"] = normalise_url(m_img.group("href"))
            data["title"] = (m_img.group("alt") or "").strip() or data["title"]
            continue

        m_link = LINK_RE.match(ln)
        if m_link:
            txt = m_link.group("text").strip()
            href = m_link.group("href").strip()

            # price link looks like: [£7.49](...)
            if txt.startswith("£") and not data["price_gbp"]:
                data["price_gbp"] = txt.replace("£", "").strip()
                continue

            # rating link looks like: [_4.8 out of 5 stars_ 48](...)
            if "out of 5 stars" in txt.lower() and not data["rating"]:
                sm = STARS_RE.search(txt)
                if sm:
                    data["rating"] = float(sm.group(1))
                nums = re.findall(r"\b\d+\b", txt)
                if nums:
                    data["review_count"] = int(nums[-1])
                continue

            # title link
            if (not data["title"]) and "/dp/" in href:
                data["title"] = txt
                data["product_url"] = normalise_url(href)
                continue

            # author link often contains /e/
            if (not data["author"]) and "/e/" in href:
                data["author"] = txt
                continue

        # format line
        if (not data["format"]) and ln.lower() in FORMAT_SET:
            data["format"] = ln
            continue

        # plain author line fallback
        if (not data["author"]) and data["title"]:
            lower = ln.lower()
            if (
                not ln.startswith("[")
                and not ln.startswith("£")
                and "formats available" not in lower
                and "out of 5 stars" not in lower
                and lower not in FORMAT_SET
                and len(ln) < 80
            ):
                data["author"] = ln

    return data


def extract_short_description_from_product_html(html: str) -> str | None:
    soup = BeautifulSoup(html, "html.parser")

    # 1) meta description is often short and decent
    meta = soup.find("meta", attrs={"name": "description"})
    if meta and meta.get("content"):
        desc = meta["content"].strip()
        desc = re.sub(r"\s+", " ", desc)
        return (desc[:280] + "…") if len(desc) > 280 else desc

    # 2) fallbacks: book description and feature bullets
    candidates = []
    for css in ["#bookDescription_feature_div", "#bookDescription", "#productDescription"]:
        el = soup.select_one(css)
        if el:
            txt = " ".join(el.stripped_strings)
            txt = re.sub(r"\s+", " ", txt).strip()
            if txt:
                candidates.append(txt)

    if not candidates:
        bullets = soup.select("#feature-bullets li span.a-list-item")
        bullet_texts = []
        for b in bullets:
            t = re.sub(r"\s+", " ", b.get_text(" ", strip=True)).strip()
            if t and "enter your model number" not in t.lower():
                bullet_texts.append(t)
        if bullet_texts:
            candidates.append(" ".join(bullet_texts[:3]))

    if candidates:
        txt = candidates[0]
        return (txt[:280] + "…") if len(txt) > 280 else txt

    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="https://www.amazon.co.uk/gp/new-releases/books/69")
    ap.add_argument("--section", default="Hot New Releases in Children's Books")
    ap.add_argument("--max-items", type=int, default=30)
    ap.add_argument("--with-descriptions", action="store_true")
    ap.add_argument("--sleep", type=float, default=1.0, help="Delay between product-page requests")
    ap.add_argument("--out", default="children_hot_new_releases_uk.csv")
    args = ap.parse_args()

    api_key = os.getenv("SCRAPERAPI_KEY")
    if not api_key:
        print("Missing SCRAPERAPI_KEY env var. In PowerShell: $env:SCRAPERAPI_KEY='YOUR_KEY'", file=sys.stderr)
        sys.exit(2)

    md = scraperapi_get(api_key, args.url, output_format="markdown", country_code="uk", device_type="desktop")

    section = extract_section(md, args.section)
    blocks = split_book_blocks(section)[: args.max_items]

    books = []
    for i, block in enumerate(blocks, start=1):
        book = parse_book_block(block, rank=i)

        if args.with_descriptions and book.get("product_url"):
            time.sleep(args.sleep)
            html = scraperapi_get(api_key, book["product_url"], output_format=None, country_code="uk", device_type="desktop")
            book["description"] = extract_short_description_from_product_html(html)

        # Make sure URLs are absolute
        book["product_url"] = normalise_url(book["product_url"])
        book["image_url"] = normalise_url(book["image_url"])

        books.append(book)

    fieldnames = [
        "rank",
        "title",
        "author",
        "format",
        "price_gbp",
        "rating",
        "review_count",
        "product_url",
        "image_url",
        "description",
    ]

    with open(args.out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for b in books:
            w.writerow({k: b.get(k) for k in fieldnames})

    print(f"Wrote {len(books)} rows to {args.out}")


if __name__ == "__main__":
    main()
