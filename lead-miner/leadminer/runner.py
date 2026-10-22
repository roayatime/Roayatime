"""One campaign run: plan -> search -> dedupe -> enrich -> filter -> judge -> save."""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from datetime import date, datetime, timezone
from pathlib import Path

from playwright.async_api import async_playwright

from . import enrich, export, gmaps, linkedin
from .brain import Brain
from .models import Campaign, Lead
from .store import Store

log = logging.getLogger(__name__)


@dataclass
class RunResult:
    campaign: str
    queries: int
    found: int
    new: int
    kept: list[Lead]
    files: list[Path]


def passes_filters(campaign: Campaign, lead: Lead) -> bool:
    f = campaign.filters
    if lead.source == "google_maps":
        if f.min_rating is not None and (lead.rating is None or lead.rating < f.min_rating):
            return False
        if f.min_reviews is not None and (lead.reviews or 0) < f.min_reviews:
            return False
    for field in f.must_have:
        if not getattr(lead, field, None):
            return False
    text = f"{lead.name} {lead.category}".casefold()
    return not any(word.casefold() in text for word in f.exclude_words)


def passes_score(campaign: Campaign, lead: Lead) -> bool:
    return lead.score is None or lead.score >= campaign.filters.min_score


async def _search_all(campaign: Campaign, queries: list[str], headless: bool) -> list[Lead]:
    found: list[Lead] = []
    async with enrich.http_client() as http:
        if "linkedin" in campaign.sources:
            for q in queries:
                found += await linkedin.discover(http, q, campaign.max_results_per_query)
    if "google_maps" in campaign.sources:
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(
                headless=headless, executable_path=os.environ.get("LEADMINER_CHROMIUM") or None
            )
            context = await browser.new_context(locale="en-US", viewport={"width": 1280, "height": 900})
            try:
                for q in queries:
                    try:
                        found += await gmaps.search(context, q, campaign.max_results_per_query)
                    except Exception:
                        log.exception("maps search failed for %r", q)
            finally:
                await browser.close()
    return found


async def run_campaign(
    campaign: Campaign,
    store: Store,
    brain: Brain,
    out_dir: Path,
    headless: bool = True,
) -> RunResult:
    started = datetime.now(timezone.utc).isoformat(timespec="seconds")
    queries = brain.plan_queries(campaign)
    log.info("[%s] %d queries: %s", campaign.name, len(queries), queries)

    found = await _search_all(campaign, queries, headless)

    known = store.known_keys(campaign.name)
    fresh: dict[str, Lead] = {}
    for lead in found:
        if lead.key not in known and lead.key not in fresh:
            fresh[lead.key] = lead
    new = list(fresh.values())
    log.info("[%s] %d found, %d new", campaign.name, len(found), len(new))

    async with enrich.http_client() as http:
        for lead in new:
            if campaign.needs_website_visit:
                await enrich.enrich_from_website(http, lead)
            if campaign.linkedin_lookup and lead.source != "linkedin":
                await linkedin.find_company_page(http, lead, " ".join(campaign.locations[:1]))

    candidates = [lead for lead in new if passes_filters(campaign, lead)]
    brain.qualify(campaign, candidates)
    kept = [lead for lead in candidates if passes_score(campaign, lead)]
    kept.sort(key=lambda lead: (lead.score is None, -(lead.score or 0)))

    for lead in new:
        lead.extra["kept"] = lead in kept
    # Rejected leads are stored too, so tomorrow's run doesn't judge them again.
    store.save(campaign.name, new)
    store.log_run(campaign.name, started, len(queries), len(found), len(new), len(kept))

    files: list[Path] = []
    if kept:
        day_dir = out_dir / date.today().isoformat()
        files.append(export.write_xlsx(day_dir / f"{campaign.name}.xlsx", kept, campaign.fields))
        files.append(export.write_csv(day_dir / f"{campaign.name}.csv", kept, campaign.fields))
    log.info("[%s] %d leads kept -> %s", campaign.name, len(kept), [str(f) for f in files])
    return RunResult(campaign.name, len(queries), len(found), len(new), kept, files)
