from typing import Literal, get_args

# Same names as the frontend's CATEGORY_META (app/components/Blog/categories.ts),
# which gives each one its color: keep both lists in sync.
BlogCategory = Literal[
    "Bitcoin",
    "Ethereum",
    "DeFi",
    "NFT",
    "Altcoins",
    "Analyse",
    "Réglementation",
    "Web3",
]

BLOG_CATEGORIES: tuple[str, ...] = get_args(BlogCategory)
