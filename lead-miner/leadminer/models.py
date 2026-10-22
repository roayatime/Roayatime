"""Data models: campaigns (what the user is looking for) and leads (what we found)."""

from __future__ import annotations

import hashlib
import re
from dataclasses import asdict, dataclass, field
from typing import Literal

from pydantic import BaseModel, Field, field_validator

# Every field a lead can carry. Campaigns pick a subset of these to export.
ALL_FIELDS = [
    "name",
    "category",
    "phone",
    "website",
    "address",
    "rating",
    "reviews",
    "maps_url",
    "latitude",
    "longitude",
    "plus_code",
    "email",
    "facebook",
    "instagram",
    "linkedin",
    "twitter",
    "tiktok",
    "whatsapp",
    "source",
    "query",
    "score",
    "reason",
]

# Fields that are only filled by visiting the lead's website.
WEBSITE_FIELDS = {"email", "facebook", "instagram", "twitter", "tiktok", "whatsapp"}

DEFAULT_FIELDS = [
    "name",
    "category",
    "phone",
    "website",
    "email",
    "address",
    "rating",
    "reviews",
    "maps_url",
    "score",
    "reason",
]


class Filters(BaseModel):
    min_rating: float | None = None
    min_reviews: int | None = None
    # Lead is dropped if any of these fields is empty, e.g. [phone] or [website].
    must_have: list[str] = Field(default_factory=list)
    # Lead is dropped if its name or category contains any of these words.
    exclude_words: list[str] = Field(default_factory=list)
    # Minimum AI score (0-100) to keep a lead. Ignored when AI is off.
    min_score: int = 50


class Campaign(BaseModel):
    name: str
    # companies | real_estate | custom. Only steers the AI's wording; any
    # target works with any keywords.
    target: Literal["companies", "real_estate", "custom"] = "companies"
    # Free-text description of the ideal lead, in any language. The AI uses
    # it to invent search queries and to judge every result.
    goal: str = ""
    keywords: list[str] = Field(default_factory=list)
    locations: list[str] = Field(default_factory=list)
    sources: list[Literal["google_maps", "linkedin"]] = Field(
        default_factory=lambda: ["google_maps"]
    )
    fields: list[str] = Field(default_factory=lambda: list(DEFAULT_FIELDS))
    filters: Filters = Field(default_factory=Filters)
    max_results_per_query: int = 40
    max_queries: int = 12
    ai_expand_queries: bool = True
    ai_qualify: bool = True
    # Look up each lead's LinkedIn company page via public web search.
    linkedin_lookup: bool = False
    enabled: bool = True

    @field_validator("fields")
    @classmethod
    def _known_fields(cls, value: list[str]) -> list[str]:
        unknown = [f for f in value if f not in ALL_FIELDS]
        if unknown:
            raise ValueError(f"unknown fields {unknown}; allowed: {ALL_FIELDS}")
        return value

    @property
    def needs_website_visit(self) -> bool:
        wanted = set(self.fields) | set(self.filters.must_have)
        return bool(wanted & WEBSITE_FIELDS)

    def base_queries(self) -> list[str]:
        """Keyword x location combinations, used when the AI is off or fails."""
        keywords = self.keywords or [self.goal]
        if not self.locations:
            return [k for k in keywords if k]
        return [f"{k} {loc}" for k in keywords for loc in self.locations if k]


@dataclass
class Lead:
    name: str = ""
    category: str = ""
    phone: str = ""
    website: str = ""
    address: str = ""
    rating: float | None = None
    reviews: int | None = None
    maps_url: str = ""
    latitude: float | None = None
    longitude: float | None = None
    plus_code: str = ""
    email: str = ""
    facebook: str = ""
    instagram: str = ""
    linkedin: str = ""
    twitter: str = ""
    tiktok: str = ""
    whatsapp: str = ""
    source: str = ""
    query: str = ""
    score: int | None = None
    reason: str = ""
    extra: dict = field(default_factory=dict)

    @property
    def key(self) -> str:
        """Stable identity used to never deliver the same lead twice."""
        place = re.search(r"!1s(0x[0-9a-f]+:0x[0-9a-f]+)", self.maps_url)
        if place:
            return f"gmaps:{place.group(1)}"
        if self.linkedin and self.source == "linkedin":
            return "li:" + self.linkedin.rstrip("/").lower()
        raw = "|".join(
            [self.name.strip().lower(), re.sub(r"\D", "", self.phone), self.address.strip().lower()]
        )
        return "h:" + hashlib.sha1(raw.encode()).hexdigest()[:16]

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> "Lead":
        known = {k: v for k, v in data.items() if k in cls.__dataclass_fields__}
        return cls(**known)
