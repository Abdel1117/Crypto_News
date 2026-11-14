import os
from io import BytesIO

import pytest
from PIL import Image

from app.services.blog import images
from app.services.blog.images import (
    ImageRejected,
    ImageStore,
    check_upload,
    encode,
    is_key,
)


def picture(fmt="JPEG", size=(800, 600), mode="RGB", **save) -> bytes:
    buffer = BytesIO()
    Image.new(mode, size, "orange" if mode != "RGBA" else (255, 0, 0, 128)).save(
        buffer, fmt, **save
    )
    return buffer.getvalue()


def opened(data: bytes) -> Image.Image:
    return Image.open(BytesIO(data))


class TestCheckUpload:
    @pytest.mark.parametrize("content_type", ["image/jpeg", "image/png", "image/webp"])
    def test_accepted_types(self, content_type):
        check_upload(b"x", content_type)

    @pytest.mark.parametrize("content_type", ["image/gif", "image/heic", "application/pdf", None])
    def test_other_types_are_415(self, content_type):
        with pytest.raises(ImageRejected) as error:
            check_upload(b"x", content_type)
        assert error.value.status_code == 415

    def test_5_mb_is_the_limit(self):
        check_upload(b"x" * images.MAX_BYTES, "image/png")
        with pytest.raises(ImageRejected) as error:
            check_upload(b"x" * (images.MAX_BYTES + 1), "image/png")
        assert error.value.status_code == 413


class TestEncode:
    @pytest.mark.parametrize("fmt", ["JPEG", "PNG", "WEBP"])
    def test_every_accepted_format_becomes_webp(self, fmt):
        large, small = encode(picture(fmt))
        assert opened(large).format == "WEBP"
        assert opened(small).format == "WEBP"

    def test_two_sizes_keeping_the_proportions(self):
        large, small = encode(picture(size=(3200, 1200)))
        assert opened(large).size == (1600, 600)
        assert opened(small).size == (640, 240)

    def test_small_images_are_not_enlarged(self):
        large, small = encode(picture(size=(500, 300)))
        assert opened(large).size == (500, 300)
        assert opened(small).size == (500, 300)

    def test_transparency_is_kept(self):
        large, _ = encode(picture("PNG", mode="RGBA"))
        assert opened(large).mode == "RGBA"

    def test_metadata_is_dropped(self):
        exif = Image.Exif()
        exif[0x010F] = "Phone maker"  # Make
        exif[0x8825] = {2: (48.0, 51.0, 24.0)}  # GPS latitude
        large, _ = encode(picture(exif=exif.tobytes()))
        assert "exif" not in opened(large).info
        assert len(opened(large).getexif()) == 0

    def test_photos_taken_sideways_are_turned_upright(self):
        exif = Image.Exif()
        exif[0x0112] = 6  # Orientation: rotate 90° clockwise to display
        large, _ = encode(picture(size=(400, 200), exif=exif.tobytes()))
        assert opened(large).size == (200, 400)

    @pytest.mark.parametrize(
        "data",
        [
            b"not an image at all",
            picture("GIF", mode="P"),
            picture()[:200],  # truncated JPEG
        ],
    )
    def test_anything_else_is_refused(self, data):
        with pytest.raises(ImageRejected) as error:
            encode(data)
        assert error.value.status_code == 422
        assert str(error.value) == images.NOT_AN_IMAGE

    def test_giant_images_are_refused_before_decoding(self):
        with pytest.raises(ImageRejected) as error:
            encode(picture("PNG", size=(8000, 7000), mode="1"))
        assert str(error.value) == images.TOO_MANY_PIXELS


class Clock:
    def __init__(self, value=1_000_000.0):
        self.value = value

    def __call__(self):
        return self.value

    def advance(self, seconds):
        self.value += seconds


@pytest.fixture
def store(tmp_path):
    return ImageStore(tmp_path, clock=Clock())


def age(store, key, seconds):
    """Makes `key`'s files look `seconds` old."""
    stamp = store.clock() - seconds
    for path in store.dir.glob(f"{key}*.webp"):
        os.utime(path, (stamp, stamp))


class TestImageStore:
    def test_save_writes_both_sizes_under_a_random_key(self, store):
        key = store.save(picture())
        assert is_key(key)
        assert sorted(p.name for p in store.dir.iterdir()) == [f"{key}-sm.webp", f"{key}.webp"]
        assert store.save(picture()) != key

    def test_nothing_is_written_for_a_refused_image(self, store):
        with pytest.raises(ImageRejected):
            store.save(b"nope")
        assert not store.dir.exists() or not any(store.dir.iterdir())

    def test_a_retired_image_stays_a_day(self, store):
        key = store.save(picture())
        age(store, key, 10 * 24 * 3600)  # uploaded long ago
        store.retire(key)  # unused from now on

        store.clock.advance(images.ORPHAN_AGE_SECONDS - 60)
        assert store.purge_orphans(keep=set()) == 0
        assert store.exists(key)

        store.clock.advance(120)
        assert store.purge_orphans(keep=set()) == 2
        assert not store.exists(key)
        store.retire(key)  # already gone: fine

    @pytest.mark.parametrize("key", ["../../etc/passwd", "abc", "A" * 32, ""])
    def test_only_real_keys_are_looked_up(self, store, key):
        assert not store.exists(key)
        store.retire(key)  # no error, nothing touched

    def test_purge_keeps_used_and_recent_images(self, store):
        used, recent, orphan = (store.save(picture()) for _ in range(3))
        for key in (used, orphan):
            age(store, key, images.ORPHAN_AGE_SECONDS + 60)
        age(store, recent, 60)

        assert store.purge_orphans(keep={used}) == 2  # both sizes of the orphan
        assert store.exists(used)
        assert store.exists(recent)
        assert not store.exists(orphan)

    def test_purge_without_folder(self, tmp_path):
        assert ImageStore(tmp_path / "nothing").purge_orphans(keep=set()) == 0
