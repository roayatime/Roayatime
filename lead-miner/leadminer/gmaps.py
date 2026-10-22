"""Google Maps scraper (Playwright).

For each query it opens the Maps results list, scrolls until enough places are
loaded, then opens every place and reads its details panel. The DOM reading is
done in one JavaScript call per place; turning that raw data into a Lead is
plain Python (parse_place) so it can be tested without a browser.

Google changes the Maps markup from time to time. All selectors live in
_PLACE_JS and the constants below, so a breakage is fixed in one place.
"""

from __future__ import annotations

import asyncio
import logging
import random
import re
from urllib.parse import quote, unquote

from playwright.async_api import BrowserContext, Page
from playwright.async_api import TimeoutError as PlaywrightTimeout

from .models import Lead

log = logging.getLogger(__name__)

MAPS_SEARCH = "https://www.google.com/maps/search/{q}?hl=en"
FEED = 'div[role="feed"]'
PLACE_LINK = 'a[href*="/maps/place/"]'
END_OF_LIST = "You've reached the end of the list"

_PLACE_JS = r"""
() => {
  const q = (s) => document.querySelector(s);
  const text = (s) => (q(s)?.innerText || '').trim();
  const aria = (s) => (q(s)?.getAttribute('aria-label') || '').trim();
  const phoneBtn = q('button[data-item-id^="phone:tel:"]');
  return {
    name: text('h1'),
    category: text('button[jsaction*="category"]'),
    address: aria('button[data-item-id="address"]'),
    phone_id: phoneBtn ? phoneBtn.getAttribute('data-item-id') : '',
    phone_label: aria('button[data-item-id^="phone:tel:"]'),
    website: q('a[data-item-id="authority"]')?.href || '',
    plus_code: aria('button[data-item-id="oloc"]'),
    rating_block: (q('div.F7nice')?.innerText || '').trim(),
    reviews_label: aria('span[aria-label*="review" i]'),
  };
}
"""


def _clean_label(label: str) -> str:
    """'Address: 12 Street, Cairo' -> '12 Street, Cairo'."""
    return label.split(":", 1)[1].strip() if ":" in label else label.strip()


def _to_number(raw: str) -> str:
    # Western digits, then strip grouping separators.
    raw = raw.translate(str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789"))
    return re.sub(r"[,\s.٬]", "", raw)


def parse_rating(block: str, reviews_label: str = "") -> tuple[float | None, int | None]:
    """Parse '4.6(1,234)' / '4.6\n(1,234)' and '1,234 reviews'."""
    rating = None
    reviews = None
    m = re.search(r"(\d(?:[.,]\d)?)", block or "")
    if m:
        rating = float(m.group(1).replace(",", "."))
    m = re.search(r"\(([\d,.\s٬٠-٩]+)\)", block or "")
    if not m:
        m = re.search(r"([\d,.\s٬٠-٩]+)\s*review", reviews_label or "", re.I)
    if m:
        digits = _to_number(m.group(1))
        reviews = int(digits) if digits.isdigit() else None
    return rating, reviews


def parse_coords(url: str) -> tuple[float | None, float | None]:
    m = re.search(r"!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)", url) or re.search(
        r"@(-?\d+\.\d+),(-?\d+\.\d+)", url
    )
    return (float(m.group(1)), float(m.group(2))) if m else (None, None)


def parse_place(raw: dict, url: str, query: str = "") -> Lead:
    phone = ""
    if raw.get("phone_id", "").startswith("phone:tel:"):
        phone = raw["phone_id"][len("phone:tel:") :]
    elif raw.get("phone_label"):
        phone = _clean_label(raw["phone_label"])
    rating, reviews = parse_rating(raw.get("rating_block", ""), raw.get("reviews_label", ""))
    lat, lng = parse_coords(url)
    return Lead(
        name=raw.get("name", "").strip(),
        category=raw.get("category", "").strip(),
        phone=phone.strip(),
        website=raw.get("website", "").strip(),
        address=_clean_label(raw.get("address", "")),
        rating=rating,
        reviews=reviews,
        maps_url=unquote(url.split("?")[0]) if "/maps/place/" in url else url,
        latitude=lat,
        longitude=lng,
        plus_code=_clean_label(raw.get("plus_code", "")),
        source="google_maps",
        query=query,
    )


async def _pause(low: float = 0.8, high: float = 2.2) -> None:
    await asyncio.sleep(random.uniform(low, high))


async def _accept_consent(page: Page) -> None:
    """Get past the EU cookie wall if Google shows it."""
    if "consent." not in page.url:
        return
    for label in ("Reject all", "Accept all", "Alle ablehnen", "Tout refuser", "رفض الكل", "قبول الكل"):
        button = page.get_by_role("button", name=label)
        if await button.count():
            await button.first.click()
            await page.wait_for_load_state("domcontentloaded")
            return


async def _collect_links(page: Page, limit: int) -> list[str]:
    feed = page.locator(FEED)
    try:
        await feed.wait_for(timeout=15000)
    except PlaywrightTimeout:
        return []
    stale_rounds = 0
    last = 0
    while True:
        count = await feed.locator(PLACE_LINK).count()
        if count >= limit or stale_rounds >= 4:
            break
        if await page.get_by_text(END_OF_LIST).count():
            break
        await feed.evaluate("el => el.scrollBy(0, el.scrollHeight)")
        await _pause(1.2, 2.5)
        stale_rounds = stale_rounds + 1 if count == last else 0
        last = count
    hrefs = await feed.locator(PLACE_LINK).evaluate_all("els => els.map(e => e.href)")
    unique = list(dict.fromkeys(hrefs))
    return unique[:limit]


async def _read_place(page: Page, url: str, query: str) -> Lead | None:
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=45000)
        await page.locator("h1").first.wait_for(timeout=15000)
        await _pause(0.6, 1.4)
        raw = await page.evaluate(_PLACE_JS)
    except PlaywrightTimeout:
        log.warning("timed out reading %s", url)
        return None
    lead = parse_place(raw, page.url, query)
    return lead if lead.name else None


async def search(context: BrowserContext, query: str, limit: int) -> list[Lead]:
    page = await context.new_page()
    try:
        await page.goto(MAPS_SEARCH.format(q=quote(query)), wait_until="domcontentloaded", timeout=60000)
        await _accept_consent(page)
        await _pause()
        links = await _collect_links(page, limit)
        if not links and "/maps/place/" in page.url:
            # A query that matches exactly one place opens it directly.
            links = [page.url]
        log.info("maps: %d places for %r", len(links), query)
        leads = []
        for url in links:
            lead = await _read_place(page, url, query)
            if lead:
                leads.append(lead)
        return leads
    finally:
        await page.close()
