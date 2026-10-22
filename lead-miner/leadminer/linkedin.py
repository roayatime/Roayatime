"""LinkedIn via public web search only.

The agent never logs in to LinkedIn and never loads linkedin.com pages:
scraping LinkedIn directly breaks its terms and gets accounts banned. Instead
it searches the public web (DuckDuckGo's HTML endpoint) for
site:linkedin.com/company pages and reads the titles and snippets that the
search engine already shows.

Two uses:
- discover(): a lead source of its own, one lead per company page found.
- find_company_page(): attach the LinkedIn URL to a lead found on Maps.
"""

from __future__ import annotations

import asyncio
import html
import logging
import random
import re
from urllib.parse import parse_qs, unquote, urlparse

import httpx

from .models import Lead

log = logging.getLogger(__name__)

SEARCH_URL = "https://html.duckduckgo.com/html/"
LINK_RE = re.compile(r'<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', re.S)
SNIPPET_RE = re.compile(r'class="result__snippet"[^>]*>(.*?)</(?:a|div|td)>', re.S)
COMPANY_RE = re.compile(r"^https?://([a-z]{2,3}\.)?linkedin\.com/company/[^/?#]+", re.I)


def _strip_tags(text: str) -> str:
    return html.unescape(re.sub(r"<[^>]+>", "", text or "")).strip()


def _real_url(href: str) -> str:
    """DuckDuckGo wraps results as //duckduckgo.com/l/?uddg=<url>."""
    href = html.unescape(href)
    if "uddg=" in href:
        return unquote(parse_qs(urlparse(href).query).get("uddg", [""])[0])
    return href


def parse_results(page: str) -> list[dict]:
    results = []
    # Each result block starts at its title link; the snippet follows it.
    for block in page.split('class="result__a"')[1:]:
        link = LINK_RE.search('<a class="result__a"' + block)
        if not link:
            continue
        href, title = link.groups()
        snip = SNIPPET_RE.search(block)
        snippet = snip.group(1) if snip else ""
        url = _real_url(href)
        m = COMPANY_RE.match(url)
        if m:
            results.append(
                {"url": m.group(0), "title": _strip_tags(title), "snippet": _strip_tags(snippet)}
            )
    return results


def company_name(title: str) -> str:
    """'Acme Software | LinkedIn' -> 'Acme Software'."""
    return re.split(r"\s+[|\-–]\s+LinkedIn", title)[0].strip()


async def _search(client: httpx.AsyncClient, query: str) -> list[dict]:
    await asyncio.sleep(random.uniform(1.5, 3.5))
    try:
        resp = await client.post(SEARCH_URL, data={"q": query})
    except httpx.HTTPError as exc:
        log.warning("web search failed for %r: %s", query, exc)
        return []
    if resp.status_code != 200:
        log.warning("web search returned %s for %r", resp.status_code, query)
        return []
    return parse_results(resp.text)


async def discover(client: httpx.AsyncClient, query: str, limit: int) -> list[Lead]:
    results = await _search(client, f"site:linkedin.com/company {query}")
    leads = [
        Lead(
            name=company_name(r["title"]),
            linkedin=r["url"],
            source="linkedin",
            query=query,
            extra={"snippet": r["snippet"]},
        )
        for r in results[:limit]
    ]
    log.info("linkedin: %d company pages for %r", len(leads), query)
    return leads


async def find_company_page(client: httpx.AsyncClient, lead: Lead, location: str = "") -> None:
    if lead.linkedin or not lead.name:
        return
    results = await _search(client, f'site:linkedin.com/company "{lead.name}" {location}'.strip())
    wanted = re.sub(r"\W+", "", lead.name.lower())
    for r in results:
        got = re.sub(r"\W+", "", company_name(r["title"]).lower())
        if wanted and got and (wanted in got or got in wanted):
            lead.linkedin = r["url"]
            return
