"""Article cover images: checked, re-encoded and stored on disk.

Every upload is decoded and saved again as WebP, in two sizes (article page,
cards). What is served is therefore always a real image, stripped of the
original's metadata (camera, GPS position) and much lighter than a photo
straight from a phone.

Files are named after a random key and never change: a new image gets a new
key, so browsers and nginx can cache them for a long time.

An image no article uses anymore (replaced, removed, or uploaded and never
saved) is deleted once it has been unused for a day: pages cached meanwhile
(Next keeps the API's answers a minute) never show a broken image.
"""

import os
import re
import secrets
import time
from collections.abc import Callable
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageOps

MAX_BYTES = 5 * 1024 * 1024
ACCEPTED_TYPES = frozenset({"image/jpeg", "image/png", "image/webp"})
ACCEPTED_FORMATS = frozenset({"JPEG", "PNG", "WEBP"})
# Beyond this, decoding alone would take too much memory on the server.
MAX_PIXELS = 50_000_000
LARGE = 1600  # article page, social networks
SMALL = 640  # cards
WEBP_QUALITY = 82
SUBDIR = "blog"
# An image no article uses is deleted after this long.
ORPHAN_AGE_SECONDS = 24 * 3600

KEY_PATTERN = r"^[0-9a-f]{32}$"
_KEY = re.compile(KEY_PATTERN)

WRONG_TYPE = "Format non accepté : choisissez une image JPEG, PNG ou WebP."
TOO_LARGE = "Image trop lourde : 5 Mo au maximum."
NOT_AN_IMAGE = "Ce fichier n’est pas une image JPEG, PNG ou WebP valide."
TOO_MANY_PIXELS = "Image trop grande : 50 mégapixels au maximum."

# Raised by Pillow on files that aren't images, are truncated or corrupt.
_DECODE_ERRORS = (OSError, ValueError, SyntaxError, EOFError, Image.DecompressionBombError)


class ImageRejected(Exception):
    """The upload can't be used; the message says why, for the editor."""

    def __init__(self, message: str, status_code: int = 422) -> None:
        super().__init__(message)
        self.status_code = status_code


def check_upload(data: bytes, content_type: str | None) -> None:
    """What can be refused before decoding: type announced, weight."""
    if content_type not in ACCEPTED_TYPES:
        raise ImageRejected(WRONG_TYPE, 415)
    if len(data) > MAX_BYTES:
        raise ImageRejected(TOO_LARGE, 413)


def _decode(data: bytes) -> Image.Image:
    """The image, upright, reduced to LARGE at most, in RGB or RGBA."""
    try:
        source = Image.open(BytesIO(data))
        if source.format not in ACCEPTED_FORMATS:
            raise ImageRejected(NOT_AN_IMAGE)
        # Only the header is read so far: refuse giants before decoding them.
        if source.width * source.height > MAX_PIXELS:
            raise ImageRejected(TOO_MANY_PIXELS)
        source.draft("RGB", (LARGE, LARGE))  # JPEG: decoded at a reduced scale
        image = ImageOps.exif_transpose(source)  # phones store photos sideways
        has_alpha = image.mode in ("RGBA", "LA", "PA") or "transparency" in image.info
        image = image.convert("RGBA" if has_alpha else "RGB")
        image.thumbnail((LARGE, LARGE), Image.Resampling.LANCZOS)
        return image
    except _DECODE_ERRORS as exc:
        raise ImageRejected(NOT_AN_IMAGE) from exc


def _webp(image: Image.Image) -> bytes:
    buffer = BytesIO()
    # No exif / icc_profile passed: none of the original metadata is kept.
    image.save(buffer, "WEBP", quality=WEBP_QUALITY, method=4)
    return buffer.getvalue()


def encode(data: bytes) -> tuple[bytes, bytes]:
    """(large, small) WebP versions of a JPEG, PNG or WebP image."""
    image = _decode(data)
    small = image.copy()
    small.thumbnail((SMALL, SMALL), Image.Resampling.LANCZOS)
    return _webp(image), _webp(small)


def is_key(value: str) -> bool:
    return bool(_KEY.fullmatch(value))


class ImageStore:
    """Cover images under `root`/blog: <key>.webp and <key>-sm.webp."""

    def __init__(self, root: Path, clock: Callable[[], float] = time.time) -> None:
        self.dir = Path(root) / SUBDIR
        self.clock = clock

    def _paths(self, key: str) -> tuple[Path, Path]:
        return self.dir / f"{key}.webp", self.dir / f"{key}-sm.webp"

    def save(self, data: bytes) -> str:
        """Encodes the upload and stores it; returns its new key."""
        large, small = encode(data)
        key = secrets.token_hex(16)
        self.dir.mkdir(parents=True, exist_ok=True)
        # A fresh random name: nothing points to it yet, so no reader can see
        # a half-written file and no temp-file-then-rename is needed.
        large_path, small_path = self._paths(key)
        large_path.write_bytes(large)
        small_path.write_bytes(small)
        return key

    def exists(self, key: str) -> bool:
        return is_key(key) and self._paths(key)[0].is_file()

    def retire(self, key: str) -> None:
        """Marks an image as unused from now on: purge_orphans deletes it
        ORPHAN_AGE_SECONDS later, not before."""
        if not is_key(key):
            return
        now = self.clock()
        for path in self._paths(key):
            if path.is_file():
                os.utime(path, (now, now))

    def purge_orphans(self, keep: set[str], max_age: float = ORPHAN_AGE_SECONDS) -> int:
        """Deletes images whose key isn't in `keep` and that were neither
        uploaded nor retired in the last `max_age` seconds. Returns how many
        files were removed."""
        if not self.dir.is_dir():
            return 0
        cutoff = self.clock() - max_age
        removed = 0
        for path in self.dir.glob("*.webp"):
            key = path.name.removesuffix(".webp").removesuffix("-sm")
            if key in keep or path.stat().st_mtime > cutoff:
                continue
            path.unlink(missing_ok=True)
            removed += 1
        return removed
