# types.py
from datetime import datetime
from typing import TypedDict


class CommitData(TypedDict):
    hash: str  # Commit SHA
    timestamp: datetime  # Python datetime object
    message: str  # Commit message
    additions: int  # Lines added
    deletions: int  # Lines deleted
    stressLevel: float  # 0 chill, 1 stressed (from ML)


class Breakdown(TypedDict):
    stressContribution: int
    lateNightContribution: int
    burstContribution: int
    messageQualityDeduction: int


class Result(TypedDict):
    eloDelta: int
    breakdown: Breakdown
