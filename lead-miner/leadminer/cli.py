"""Command line entry point.

    python -m leadminer run                 # run every enabled campaign
    python -m leadminer run -c my-campaign  # run one campaign
    python -m leadminer plan -c my-campaign # show the queries the AI would search
    python -m leadminer list                # list campaigns
    python -m leadminer export -c my-campaign  # every lead ever kept, one file
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import os
import sys
from pathlib import Path

from . import export
from .brain import Brain
from .config import load_campaigns
from .runner import run_campaign
from .store import Store

log = logging.getLogger("leadminer")


def _pick(campaigns, name):
    if not name:
        return [c for c in campaigns if c.enabled]
    picked = [c for c in campaigns if c.name == name]
    if not picked:
        sys.exit(f"no campaign named {name!r}; have: {[c.name for c in campaigns]}")
    return picked


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="leadminer", description="AI lead mining agent")
    parser.add_argument("--config", default=os.environ.get("LEADMINER_CONFIG", "config/campaigns.yaml"))
    parser.add_argument("--data", default=os.environ.get("LEADMINER_DATA", "data"))
    parser.add_argument("-v", "--verbose", action="store_true")
    sub = parser.add_subparsers(dest="cmd", required=True)

    run_p = sub.add_parser("run", help="search, judge and export new leads")
    run_p.add_argument("-c", "--campaign")
    run_p.add_argument("--headful", action="store_true", help="show the browser window")
    run_p.add_argument("--no-ai", action="store_true", help="skip AI planning and scoring")

    plan_p = sub.add_parser("plan", help="print the search queries without searching")
    plan_p.add_argument("-c", "--campaign")

    sub.add_parser("list", help="list campaigns")

    exp_p = sub.add_parser("export", help="export every kept lead of a campaign")
    exp_p.add_argument("-c", "--campaign", required=True)

    args = parser.parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    for noisy in ("httpx", "httpx2", "httpcore", "anthropic"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    campaigns = load_campaigns(args.config)
    data = Path(args.data)

    if args.cmd == "list":
        for c in campaigns:
            state = "on " if c.enabled else "off"
            print(f"[{state}] {c.name}  ({c.target}, sources={','.join(c.sources)})  {c.goal}")
        return 0

    if args.cmd == "plan":
        brain = Brain()
        for c in _pick(campaigns, args.campaign):
            print(f"# {c.name}")
            for q in brain.plan_queries(c):
                print(f"  - {q}")
        return 0

    store = Store(data / "leads.db")
    try:
        if args.cmd == "export":
            (c,) = _pick(campaigns, args.campaign)
            leads = [lead for lead in store.all_leads(c.name) if lead.extra.get("kept")]
            path = export.write_xlsx(data / "out" / f"{c.name}_all.xlsx", leads, c.fields)
            print(f"{len(leads)} leads -> {path}")
            return 0

        brain = Brain(enabled=not args.no_ai)
        if not brain.active:
            log.warning("running without AI (no credentials, LEADMINER_AI=off or --no-ai)")
        failed = False
        for c in _pick(campaigns, args.campaign):
            try:
                result = asyncio.run(run_campaign(c, store, brain, data / "out", headless=not args.headful))
                print(f"{c.name}: {len(result.kept)} new leads ({result.found} found, {result.new} unseen)")
            except Exception:
                log.exception("campaign %s failed", c.name)
                failed = True
        return 1 if failed else 0
    finally:
        store.close()
