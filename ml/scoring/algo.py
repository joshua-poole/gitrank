# algo.py
import math
from datetime import datetime, timedelta
from typing import List

from .types import Breakdown, CommitData, Result


class ELO:
    def __init__(self) -> None:
        self.DECAY_PER_DAY = 0.99
        self.MAX_AGE_DAYS = 90
        self.TZ_OFFSET_MIN = 0

        self.WEIGHTS = {
            "loc": 0.35,  # Lines of change (biggest impact)
            "time": 0.15,  # Time of day (business hours)
            "day": 0.10,  # Weekday vs weekend
            "message": 0.30,  # Commit message quality (ML-powered)
            "consistency": 0.10,  # Consistent pacing
        }

    def calculate(self, commits: List[CommitData]) -> Result:
        now = datetime.now()

        # Filter and sort commits
        recent: List[CommitData] = []
        for c in commits:
            age_days = (now - c["timestamp"]).days
            if age_days <= self.MAX_AGE_DAYS:
                recent.append(c)

        recent.sort(key=lambda c: c["timestamp"])

        # Calculate consistency score from burstiness (inverse)
        burstiness = self._simple_burstiness(recent)
        consistency = 1.0 - burstiness

        total = 0.0
        weight_sum = 0.0
        avg_msg_score = 0.0
        avg_time_score = 0.0
        total_stress = 0.0

        for c in recent:
            age_days = (now - c["timestamp"]).total_seconds() / 86400
            w = pow(self.DECAY_PER_DAY, age_days)

            loc_score = self._loc_score(c)
            time_score = self._time_score(c)
            day_score = self._day_score(c)
            msg_score = 1.0 - c["stressLevel"]  # Based on ML sentiment

            # Track for breakdown
            avg_time_score += time_score
            avg_msg_score += msg_score
            total_stress += c["stressLevel"]

            # Weighted combination
            combined = (
                self.WEIGHTS["loc"] * loc_score
                + self.WEIGHTS["time"] * time_score
                + self.WEIGHTS["day"] * day_score
                + self.WEIGHTS["message"] * msg_score
                + self.WEIGHTS["consistency"] * consistency
            )

            # Scale to 0-5000 range
            spike = combined * 100

            total += spike * w
            weight_sum += w

        # Calculate averages
        commit_count = len(recent)
        if commit_count > 0:
            avg_time_score /= commit_count
            avg_msg_score /= commit_count
            avg_stress = total_stress / commit_count
        else:
            avg_time_score = 0.5
            avg_msg_score = 0.5
            avg_stress = 0.5

        level = int(min(5000, max(0, round(total))))

        breakdown: Breakdown = {
            "stressContribution": round(avg_stress * 100),
            "lateNightContribution": round((1 - avg_time_score) * 100),
            "burstContribution": round(burstiness * 100),
            "messageQualityDeduction": round((1 - avg_msg_score) * 100),
        }

        result: Result = {
            "eloDelta": level,
            "breakdown": breakdown,
        }

        return result

    def _loc_score(self, c: CommitData) -> float:
        """Score based on lines changed (0-1 scale)"""
        changes = c["additions"] + c["deletions"]
        return min(1.0, math.log10(changes + 1) / 4)

    def _time_score(self, c: CommitData) -> float:
        """Score based on time of day (peak during work hours)"""
        hour = self._hour_local(c)

        if 9 <= hour <= 17:
            return 1.0
        elif 6 <= hour <= 8 or 18 <= hour <= 22:
            return 0.5
        else:
            return 0.0

    def _day_score(self, c: CommitData) -> float:
        """Score based on day of week"""
        day = self._day_local(c)
        return 1.0 if day not in (0, 6) else 0.3

    def _simple_burstiness(self, commits: List[CommitData]) -> float:
        if len(commits) < 3:
            return 0.0

        hours: List[float] = []
        for i in range(1, len(commits)):
            diff_h = (
                commits[i]["timestamp"] - commits[i - 1]["timestamp"]
            ).total_seconds() / 3600
            hours.append(max(0.0, min(48.0, diff_h)))

        avg = sum(hours) / len(hours)
        variance = sum((h - avg) ** 2 for h in hours) / len(hours)
        sd = math.sqrt(variance)
        cv = sd / avg if avg > 0 else 0

        return min(1.0, cv / 2)

    def _hour_local(self, c: CommitData) -> int:
        adjusted = c["timestamp"] + timedelta(minutes=self.TZ_OFFSET_MIN)
        return adjusted.hour

    def _day_local(self, c: CommitData) -> int:
        adjusted = c["timestamp"] + timedelta(minutes=self.TZ_OFFSET_MIN)
        weekday = adjusted.weekday()
        return (weekday + 1) % 7

    def _lerp(self, a: float, b: float, t: float) -> float:
        clamped = max(0.0, min(1.0, t))
        return a + (b - a) * clamped
