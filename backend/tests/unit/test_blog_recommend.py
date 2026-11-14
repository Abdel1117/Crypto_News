from datetime import datetime, timedelta, timezone

from app.services.blog.recommend import Candidate, rank, score

NOW = datetime(2026, 11, 9, tzinfo=timezone.utc)
OLD = NOW - timedelta(days=90)


def article(id, category="Bitcoin", likes=0, published_at=OLD):
    return Candidate(id=id, category=category, likes=likes, published_at=published_at)


class TestScore:
    def test_same_category_counts_most(self):
        same = score(article(1, "DeFi"), NOW, current_category="DeFi")
        popular = score(article(2, "NFT", likes=10), NOW, current_category="DeFi")
        assert same > popular

    def test_recent_articles_get_a_bonus(self):
        assert score(article(1, published_at=NOW - timedelta(days=3)), NOW) == 1.0
        assert score(article(1, published_at=OLD), NOW) == 0.0

    def test_naive_dates_are_read_as_utc(self):
        naive = (NOW - timedelta(days=1)).replace(tzinfo=None)
        assert score(article(1, published_at=naive), NOW) == 1.0

    def test_preferred_categories_and_liked_articles(self):
        assert score(article(1, "DeFi"), NOW, preferred_categories=frozenset({"DeFi"})) == 2.0
        assert score(article(1), NOW, liked_ids=frozenset({1})) == -2.0


class TestRank:
    def test_excludes_the_current_article_and_limits(self):
        candidates = [article(i) for i in range(1, 6)]
        ids = rank(candidates, 2, NOW, exclude_ids=[1])
        assert len(ids) == 2
        assert 1 not in ids

    def test_ties_go_to_the_most_recent(self):
        candidates = [
            article(1, published_at=OLD),
            article(2, published_at=OLD + timedelta(days=1)),
            article(3, published_at=OLD - timedelta(days=1)),
        ]
        assert rank(candidates, 3, NOW) == [2, 1, 3]

    def test_same_category_first_then_popularity(self):
        candidates = [
            article(1, "NFT", likes=10),
            article(2, "DeFi", likes=0),
            article(3, "DeFi", likes=5),
        ]
        assert rank(candidates, 3, NOW, current_category="DeFi") == [3, 2, 1]

    def test_empty(self):
        assert rank([], 3, NOW) == []
