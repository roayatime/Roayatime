"""Load campaigns from a YAML file."""

from __future__ import annotations

from pathlib import Path

import yaml

from .models import Campaign


def load_campaigns(path: str | Path) -> list[Campaign]:
    data = yaml.safe_load(Path(path).read_text(encoding="utf-8")) or {}
    items = data.get("campaigns", [])
    campaigns = [Campaign(**item) for item in items]
    names = [c.name for c in campaigns]
    dupes = {n for n in names if names.count(n) > 1}
    if dupes:
        raise ValueError(f"duplicate campaign names: {sorted(dupes)}")
    return campaigns
