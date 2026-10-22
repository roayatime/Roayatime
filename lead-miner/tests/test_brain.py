from leadminer.brain import Brain
from leadminer.models import Campaign, Lead


class StubBrain(Brain):
    def __init__(self, answer):
        super().__init__(enabled=False)
        self.client = object()  # mark active; _ask_json is stubbed
        self.answer = answer

    def _ask_json(self, system, prompt, schema):
        return self.answer


def test_plan_keeps_user_keywords_first_and_dedupes():
    c = Campaign(name="x", keywords=["chalets"], locations=["Sahel"], max_queries=3)
    brain = StubBrain({"queries": ["Chalets Sahel", "شاليهات للإيجار الساحل", "villas Marassi", "extra"]})
    assert brain.plan_queries(c) == ["chalets Sahel", "شاليهات للإيجار الساحل", "villas Marassi"]


def test_plan_falls_back_when_ai_fails():
    c = Campaign(name="x", keywords=["a", "b"])
    assert StubBrain(None).plan_queries(c) == ["a", "b"]


def test_qualify_maps_ids_and_clamps():
    leads = [Lead(name="A"), Lead(name="B")]
    brain = StubBrain({"results": [{"id": 1, "score": 140, "reason": "ok"}, {"id": 9, "score": 5, "reason": "?"}]})
    brain.qualify(Campaign(name="x"), leads)
    assert (leads[0].score, leads[1].score, leads[1].reason) == (None, 100, "ok")
