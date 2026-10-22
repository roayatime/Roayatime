"""SQLite store: remembers every lead so the daily run only reports new ones."""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from .models import Lead

SCHEMA = """
CREATE TABLE IF NOT EXISTS leads (
    campaign   TEXT NOT NULL,
    key        TEXT NOT NULL,
    data       TEXT NOT NULL,
    first_seen TEXT NOT NULL,
    last_seen  TEXT NOT NULL,
    PRIMARY KEY (campaign, key)
);
CREATE TABLE IF NOT EXISTS runs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign   TEXT NOT NULL,
    started_at TEXT NOT NULL,
    queries    INTEGER NOT NULL,
    found      INTEGER NOT NULL,
    new        INTEGER NOT NULL,
    kept       INTEGER NOT NULL
);
"""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class Store:
    def __init__(self, path: str | Path):
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(path)
        self.db.executescript(SCHEMA)

    def known_keys(self, campaign: str) -> set[str]:
        rows = self.db.execute("SELECT key FROM leads WHERE campaign = ?", (campaign,))
        return {r[0] for r in rows}

    def save(self, campaign: str, leads: list[Lead]) -> None:
        now = _now()
        self.db.executemany(
            """INSERT INTO leads (campaign, key, data, first_seen, last_seen)
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT (campaign, key) DO UPDATE
               SET data = excluded.data, last_seen = excluded.last_seen""",
            [
                (campaign, lead.key, json.dumps(lead.to_dict(), ensure_ascii=False), now, now)
                for lead in leads
            ],
        )
        self.db.commit()

    def all_leads(self, campaign: str) -> list[Lead]:
        rows = self.db.execute(
            "SELECT data FROM leads WHERE campaign = ? ORDER BY first_seen", (campaign,)
        )
        return [Lead.from_dict(json.loads(r[0])) for r in rows]

    def log_run(self, campaign: str, started_at: str, queries: int, found: int, new: int, kept: int) -> None:
        self.db.execute(
            "INSERT INTO runs (campaign, started_at, queries, found, new, kept) VALUES (?, ?, ?, ?, ?, ?)",
            (campaign, started_at, queries, found, new, kept),
        )
        self.db.commit()

    def close(self) -> None:
        self.db.close()
