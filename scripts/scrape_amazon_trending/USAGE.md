# Weekly Trending Books Refresh

This pack adds:
- `scripts/scrape_amazon_trending/scrape.py` (reads SCRAPERAPI_KEY from env, scrapes Amazon new releases via ScraperAPI)
- `docs/seeds/children_books.csv` (weekly generated)
- `scripts/csv_to_trending_json.py` (converts CSV to app JSON)
- `src/content/media_amazon_trending.json` (used by the app)
- `.github/workflows/refresh_trending_books.yml` (GitHub Actions weekly refresh)

## GitHub Secret
Add repository secret:
- Name: `SCRAPERAPI_KEY`
- Value: your ScraperAPI key

GitHub UI path:
Settings → Secrets and variables → Actions → New repository secret

## Run locally (PowerShell)
```powershell
cd "C:\PROJECTS\Sparkle World"
$env:SCRAPERAPI_KEY="YOUR_TEST_KEY"
python scripts\scrape_amazon_trending\scrape.py --out docs\seeds\children_books.csv --max-items 30 --with-descriptions
python scripts\csv_to_trending_json.py --in docs\seeds\children_books.csv --out src\content\media_amazon_trending.json
```

## Notes
- No secrets should ever be committed.
- The app should treat this JSON as content; scraping is build-time automation only.
