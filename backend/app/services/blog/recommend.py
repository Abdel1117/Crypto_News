"""Which articles to suggest next: a small score, no machine learning.

- same category as the article being read: +3
- a category the reader has liked or saved before: +2
- popularity: +log(1 + likes), so a few likes count, hundreds don't crush the rest
- published in the last 30 days: +1
- already liked by the reader: -2 (show them something new)

Ties go to the most recent article, so with no likes at all the suggestions
are simply the latest articles.
"""

import math
from collections.abc import Iterable
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

SAME_CATEGORY = 3.0
PREFERRED_CATEGORY = 2.0
RECENT_BONUS = 1.0
ALREADY_LIKED = -2.0
RECENT = timedelta(days=30)


@dataclass(frozen=True)
class Candidate:
    id: int
    category: str
    likes: int
    published_at: datetime


def _aware(value: datetime) -> datetime:
    # SQLite gives back naive datetimes; they are stored in UTC.
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def score(
    candidate: Candidate,
    now: datetime,
    current_category: str | None = None,
    preferred_categories: frozenset[str] = frozenset(),
    liked_ids: frozenset[int] = frozenset(),
) -> float:
    total = math.log1p(max(candidate.likes, 0))
    if current_category is not None and candidate.category == current_category:
        total += SAME_CATEGORY
    if candidate.category in preferred_categories:
        total += PREFERRED_CATEGORY
    if _aware(now) - _aware(candidate.published_at) <= RECENT:
        total += RECENT_BONUS
    if candidate.id in liked_ids:
        total += ALREADY_LIKED
    return total


def rank(
    candidates: Iterable[Candidate],
    limit: int,
    now: datetime,
    exclude_ids: Iterable[int] = (),
    current_category: str | None = None,
    preferred_categories: Iterable[str] = (),
    liked_ids: Iterable[int] = (),
) -> list[int]:
    """Ids of the `limit` best candidates, best first."""
    excluded = set(exclude_ids)
    preferred = frozenset(preferred_categories)
    liked = frozenset(liked_ids)
    scored = [
        (
            score(c, now, current_category, preferred, liked),
            _aware(c.published_at),
            c.id,
        )
        for c in candidates
        if c.id not in excluded
    ]
    scored.sort(reverse=True)
    return [article_id for _, _, article_id in scored[:limit]]
