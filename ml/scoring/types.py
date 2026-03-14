# types.py
from datetime import datetime
from typing import NotRequired, Optional, TypedDict


class Tier(TypedDict):
    rank: str
    minElo: int
    maxElo: int
    description: str


class CommitData(TypedDict):
    hash: str  # Commit SHA
    timestamp: datetime  # Python datetime object
    message: str  # Commit message
    additions: int  # Lines added
    deletions: int  # Lines deleted
    filesChanged: int  # Number of files touched


class MLSignals(TypedDict):
    stressLevel: float  # 0 chill, 1 stressed
    msgQuality: NotRequired[Optional[float]]
    sloppiness: NotRequired[Optional[float]]


class Breakdown(TypedDict):
    stressContribution: int
    lateNightContribution: int
    burstContribution: int
    messageQualityDeduction: int


class SpikeResult(TypedDict):
    glucoseLevel: int
    tier: Tier
    breakdown: Breakdown
    recommendation: str
