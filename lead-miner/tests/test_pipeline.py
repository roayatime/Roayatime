import asyncio

import pytest

from leadminer import runner
from leadminer.brain import Brain
from leadminer.models import Campaign, Filters, Lead
from leadminer.store import Store


def _lead(n, **kw):
    base = dict(name=f"Place {n}", phone=f"010{n}", maps_url=f"https://www.google.com/maps/place/p/data=!1s0x{n:x}:0x{n:x}!8m2", source="google_maps")
    base.update(kw)
    return Lead(**base)


@pytest.fixture
def campaign():
    return Campaign(
        name="t",
        keywords=["chalets"],
        locations=["Sahel"],
        fields=["name", "phone", "rating", "score"],
        filters=Filters(min_rating=4.0, must_have=["phone"], exclude_words=["hotel"]),
        ai_expand_queries=False,
    )


def test_base_queries(campaign):
    assert campaign.base_queries() == ["chalets Sahel"]


def test_unknown_field_rejected():
    with pytest.raises(ValueError):
        Campaign(name="x", fields=["name", "nope"])


def test_run_dedupes_filters_and_remembers(tmp_path, monkeypatch, campaign):
    found = [
        _lead(1, rating=4.5),
        _lead(1, rating=4.5),                 # duplicate in the same run
        _lead(2, rating=3.0),                 # rating too low
        _lead(3, rating=4.8, phone=""),       # no phone
        _lead(4, rating=4.9, name="Sea Hotel"),  # excluded word
        _lead(5, rating=4.1),
    ]

    async def fake_search(c, queries, headless):
        return list(found)

    monkeypatch.setattr(runner, "_search_all", fake_search)
    store = Store(tmp_path / "leads.db")
    brain = Brain(enabled=False)

    first = asyncio.run(runner.run_campaign(campaign, store, brain, tmp_path / "out"))
    assert [lead.name for lead in first.kept] == ["Place 1", "Place 5"]
    assert first.new == 5
    assert {p.suffix for p in first.files} == {".xlsx", ".csv"}

    second = asyncio.run(runner.run_campaign(campaign, store, brain, tmp_path / "out"))
    assert second.new == 0 and second.kept == [] and second.files == []

    kept = [l for l in store.all_leads("t") if l.extra.get("kept")]
    assert sorted(l.name for l in kept) == ["Place 1", "Place 5"]


def test_ai_score_threshold(tmp_path, monkeypatch, campaign):
    async def fake_search(c, queries, headless):
        return [_lead(1, rating=4.5), _lead(2, rating=4.5)]

    class FakeBrain(Brain):
        def __init__(self):
            super().__init__(enabled=False)

        def qualify(self, c, leads):
            for lead, s in zip(leads, [90, 20]):
                lead.score, lead.reason = s, "test"

    monkeypatch.setattr(runner, "_search_all", fake_search)
    result = asyncio.run(runner.run_campaign(campaign, Store(tmp_path / "db"), FakeBrain(), tmp_path / "out"))
    assert [(l.name, l.score) for l in result.kept] == [("Place 1", 90)]
