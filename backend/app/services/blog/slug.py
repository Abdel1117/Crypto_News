"""Article URLs: /blog/<slug>, made once from the title."""

import re
import unicodedata
from collections.abc import Iterable

# Static pages under /blog that an article must not shadow.
RESERVED_SLUGS = frozenset({"favoris"})
MAX_SLUG_LENGTH = 80
WORDS_PER_MINUTE = 200

# Letters NFKD doesn't split into a base letter + accent.
_LIGATURES = str.maketrans({"œ": "oe", "Œ": "OE", "æ": "ae", "Æ": "AE", "ß": "ss"})
_NOT_ALPHANUMERIC = re.compile(r"[^a-z0-9]+")


def slugify(text: str) -> str:
    """'Réglementation : MiCA en Europe' → 'reglementation-mica-en-europe'."""
    decomposed = unicodedata.normalize("NFKD", text.translate(_LIGATURES))
    ascii_text = decomposed.encode("ascii", "ignore").decode("ascii").lower()
    slug = _NOT_ALPHANUMERIC.sub("-", ascii_text).strip("-")
    return slug[:MAX_SLUG_LENGTH].rstrip("-") or "article"


def unique_slug(title: str, taken: Iterable[str]) -> str:
    """The title's slug, with -2, -3… if another article (or a page) already has it."""
    base = slugify(title)
    used = set(taken) | RESERVED_SLUGS
    if base not in used:
        return base
    n = 2
    while f"{base}-{n}" in used:
        n += 1
    return f"{base}-{n}"


def read_minutes(body: str) -> int:
    """Reading time at 200 words a minute, at least 1."""
    return max(1, round(len(body.split()) / WORDS_PER_MINUTE))
