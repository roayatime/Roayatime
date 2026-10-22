"""Visit a lead's website to find emails and social profiles."""

from __future__ import annotations

import logging
import re
from urllib.parse import urljoin, urlparse

import httpx

from .models import Lead

log = logging.getLogger(__name__)

USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/140.0 Safari/537.36"
)
CONTACT_PATHS = ["", "/contact", "/contact-us", "/about", "/ar/contact"]

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,24}")
HREF_RE = re.compile(r"""href\s*=\s*["']([^"']+)["']""", re.I)
# Things that look like emails but are not contact addresses.
EMAIL_NOISE = re.compile(r"\.(png|jpe?g|gif|svg|webp|css|js)$|@(sentry|example|domain|email)\.", re.I)

SOCIAL_HOSTS = {
    "facebook": ("facebook.com", "fb.com"),
    "instagram": ("instagram.com",),
    "linkedin": ("linkedin.com",),
    "twitter": ("twitter.com", "x.com"),
    "tiktok": ("tiktok.com",),
    "whatsapp": ("wa.me", "whatsapp.com", "api.whatsapp.com"),
}
# Share buttons and other links that are not the business's own profile.
SOCIAL_NOISE = re.compile(r"/(sharer|share|intent|plugins|dialog)[/.?]|/home\.php", re.I)


def extract_contacts(html: str, base_url: str) -> dict[str, str]:
    found: dict[str, str] = {}
    emails = []
    for href in HREF_RE.findall(html):
        if href.lower().startswith("mailto:"):
            emails.append(href[7:].split("?")[0])
            continue
        url = urljoin(base_url, href)
        host = urlparse(url).netloc.lower().removeprefix("www.").removeprefix("m.")
        for field, hosts in SOCIAL_HOSTS.items():
            if field not in found and host in hosts and not SOCIAL_NOISE.search(url):
                if urlparse(url).path.strip("/") or field == "whatsapp":
                    found[field] = url
    emails += EMAIL_RE.findall(html)
    for email in emails:
        email = email.strip().strip(".").lower()
        if EMAIL_RE.fullmatch(email) and not EMAIL_NOISE.search(email):
            found["email"] = email
            break
    return found


async def enrich_from_website(client: httpx.AsyncClient, lead: Lead) -> None:
    if not lead.website:
        return
    base = lead.website if "://" in lead.website else "https://" + lead.website
    for path in CONTACT_PATHS:
        try:
            resp = await client.get(urljoin(base, path) if path else base)
        except httpx.HTTPError:
            continue
        if resp.status_code != 200 or "html" not in resp.headers.get("content-type", ""):
            continue
        for field, value in extract_contacts(resp.text, str(resp.url)).items():
            if not getattr(lead, field):
                setattr(lead, field, value)
        if lead.email:
            return


def http_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(
        headers={"User-Agent": USER_AGENT},
        follow_redirects=True,
        timeout=httpx.Timeout(15.0),
    )
