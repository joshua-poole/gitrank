# tiers.py
from typing import List

from .types import Tier

TIERS: List[Tier] = [
    {
        "rank": "PLASTIC",
        "minElo": 0,
        "maxElo": 500,
        "description": "Zen Master",
    },
    {
        "rank": "BRONZE",
        "minElo": 501,
        "maxElo": 1500,
        "description": "Mildly Caffeinated",
    },
    {
        "rank": "SILVER",
        "minElo": 1501,
        "maxElo": 2500,
        "description": "Commit Addict",
    },
    {
        "rank": "GOLD",
        "minElo": 2501,
        "maxElo": 3500,
        "description": "Chronically Online",
    },
    {
        "rank": "DIAMOND",
        "minElo": 3501,
        "maxElo": 4500,
        "description": "MAXIMUM BURNOUT",
    },
    {
        "rank": "LINUS",
        "minElo": 4501,
        "maxElo": 5000,
        "description": "Linus Torvalds Mode",
    },
]


def get_tier_from_level(level: int) -> Tier:
    for tier in TIERS:
        if tier["minElo"] <= level <= tier["maxElo"]:
            return tier
    return TIERS[0]


def get_rank_from_level(level: int) -> str:
    return get_tier_from_level(level)["rank"]
