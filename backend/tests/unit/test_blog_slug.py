import pytest

from app.services.blog.slug import MAX_SLUG_LENGTH, read_minutes, slugify, unique_slug


class TestSlugify:
    @pytest.mark.parametrize(
        "title,slug",
        [
            ("Bitcoin franchit les 100 000 $", "bitcoin-franchit-les-100-000"),
            ("Réglementation : MiCA en Europe", "reglementation-mica-en-europe"),
            ("L'œuvre d'un cœur", "l-oeuvre-d-un-coeur"),
            ("  Ethereum 3.0 — quoi de neuf ?  ", "ethereum-3-0-quoi-de-neuf"),
        ],
    )
    def test_ascii_lowercase_hyphens(self, title, slug):
        assert slugify(title) == slug

    def test_title_without_letters_still_gets_a_slug(self):
        assert slugify("!!! ???") == "article"

    def test_is_capped_without_a_trailing_hyphen(self):
        slug = slugify("mot " * 60)
        assert len(slug) <= MAX_SLUG_LENGTH
        assert not slug.endswith("-")


class TestUniqueSlug:
    def test_free_slug_is_kept(self):
        assert unique_slug("Mon article", ["autre"]) == "mon-article"

    def test_taken_slug_gets_the_next_number(self):
        taken = ["mon-article", "mon-article-2"]
        assert unique_slug("Mon article", taken) == "mon-article-3"

    def test_reserved_page_names_are_avoided(self):
        assert unique_slug("Favoris", []) == "favoris-2"


class TestReadMinutes:
    def test_at_least_one_minute(self):
        assert read_minutes("court") == 1

    def test_two_hundred_words_a_minute(self):
        assert read_minutes("mot " * 1000) == 5
