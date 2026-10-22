"""The AI part of the agent: plans search queries and judges each lead.

Uses Claude through the official Anthropic SDK. If no credentials are set, or
a call fails, the agent keeps working without AI: it searches the plain
keyword x location combinations and keeps every lead that passes the filters.
"""

from __future__ import annotations

import json
import logging
import os

import anthropic

from .models import Campaign, Lead

log = logging.getLogger(__name__)

DEFAULT_MODEL = "claude-opus-5-5"
QUALIFY_BATCH = 20

PLAN_SCHEMA = {
    "type": "object",
    "properties": {"queries": {"type": "array", "items": {"type": "string"}}},
    "required": ["queries"],
    "additionalProperties": False,
}

QUALIFY_SCHEMA = {
    "type": "object",
    "properties": {
        "results": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "integer"},
                    "score": {"type": "integer"},
                    "reason": {"type": "string"},
                },
                "required": ["id", "score", "reason"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["results"],
    "additionalProperties": False,
}

PLAN_SYSTEM = """You plan Google Maps searches for a lead-generation agent.
Given what the user is looking for, write short search queries exactly as a
person would type them into Google Maps. Mix the user's language with English
when that finds more places, cover synonyms and sub-types, and pair queries
with each target location (and notable districts inside it) when locations are
given. Every query must be likely to return places that match the goal."""

QUALIFY_SYSTEM = """You qualify leads for a lead-generation agent.
For each place, score from 0 to 100 how well it matches the user's goal, using
only the data given (name, category, address, website, rating, ...).
100 = clearly the kind of lead wanted, 50 = unclear, 0 = clearly unrelated
(wrong business type, wrong area, a directory or a government office when a
business is wanted). Give a one-sentence reason in the user's language."""


class Brain:
    def __init__(self, model: str | None = None, enabled: bool = True):
        self.model = model or os.environ.get("LEADMINER_MODEL", DEFAULT_MODEL)
        self.effort = os.environ.get("LEADMINER_EFFORT", "medium")
        self.client: anthropic.Anthropic | None = None
        if enabled and os.environ.get("LEADMINER_AI", "on").lower() != "off":
            try:
                self.client = anthropic.Anthropic()
            except Exception as exc:  # missing credentials raise here
                log.warning("AI disabled: %s", exc)

    @property
    def active(self) -> bool:
        return self.client is not None

    def _ask_json(self, system: str, prompt: str, schema: dict) -> dict | None:
        if self.client is None:
            return None
        try:
            resp = self.client.beta.messages.create(
                model=self.model,
                max_tokens=16000,
                betas=["server-side-fallback-2026-07-01"],
                fallbacks="default",
                thinking={"type": "adaptive"},
                output_config={
                    "effort": self.effort,
                    "format": {"type": "json_schema", "schema": schema},
                },
                system=system,
                messages=[{"role": "user", "content": prompt}],
            )
        except TypeError as exc:  # the SDK raises this when no credentials are set
            log.warning("AI disabled, no Anthropic credentials found: %s", exc)
            self.client = None
            return None
        except (anthropic.AuthenticationError, anthropic.PermissionDeniedError) as exc:
            log.error("AI credentials rejected, continuing without AI: %s", exc)
            self.client = None
            return None
        except anthropic.BadRequestError as exc:
            log.error("AI request rejected: %s", exc.message)
            return None
        except anthropic.RateLimitError:
            log.warning("AI rate limited, skipping this step")
            return None
        except anthropic.APIStatusError as exc:
            log.warning("AI error %s, skipping this step", exc.status_code)
            return None
        except anthropic.APIConnectionError:
            log.warning("AI unreachable, skipping this step")
            return None

        if resp.stop_reason in ("refusal", "max_tokens"):
            log.warning("AI stopped early (%s), skipping this step", resp.stop_reason)
            return None
        text = "".join(b.text for b in resp.content if b.type == "text")
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            log.warning("AI returned invalid JSON, skipping this step")
            return None

    def plan_queries(self, campaign: Campaign) -> list[str]:
        base = campaign.base_queries()
        if not (campaign.ai_expand_queries and self.active):
            return _dedupe(base)[: campaign.max_queries]
        prompt = json.dumps(
            {
                "target_type": campaign.target,
                "goal": campaign.goal,
                "keywords": campaign.keywords,
                "locations": campaign.locations,
                "max_queries": campaign.max_queries,
            },
            ensure_ascii=False,
        )
        data = self._ask_json(PLAN_SYSTEM, prompt, PLAN_SCHEMA)
        planned = [q.strip() for q in (data or {}).get("queries", []) if q.strip()]
        # The user's own keywords always run first; the AI's ideas fill the rest.
        return _dedupe(base + planned)[: campaign.max_queries]

    def qualify(self, campaign: Campaign, leads: list[Lead]) -> None:
        """Set score and reason on each lead in place. No-op without AI."""
        if not (campaign.ai_qualify and self.active):
            return
        for start in range(0, len(leads), QUALIFY_BATCH):
            batch = leads[start : start + QUALIFY_BATCH]
            places = [
                {
                    "id": i,
                    "name": lead.name,
                    "category": lead.category,
                    "address": lead.address,
                    "website": lead.website,
                    "rating": lead.rating,
                    "reviews": lead.reviews,
                    "source": lead.source,
                    "snippet": lead.extra.get("snippet", ""),
                }
                for i, lead in enumerate(batch)
            ]
            prompt = json.dumps(
                {"target_type": campaign.target, "goal": campaign.goal or campaign.keywords, "places": places},
                ensure_ascii=False,
            )
            data = self._ask_json(QUALIFY_SYSTEM, prompt, QUALIFY_SCHEMA)
            for item in (data or {}).get("results", []):
                idx = item.get("id")
                if isinstance(idx, int) and 0 <= idx < len(batch):
                    batch[idx].score = max(0, min(100, int(item["score"])))
                    batch[idx].reason = item.get("reason", "")


def _dedupe(items: list[str]) -> list[str]:
    seen: set[str] = set()
    out = []
    for item in items:
        k = item.casefold()
        if k not in seen:
            seen.add(k)
            out.append(item)
    return out
