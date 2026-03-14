# algo.py
import math
import re
from datetime import datetime, timedelta
from typing import List

from .tiers import get_tier_from_level
from .types import Breakdown, CommitData, MLSignals, SpikeResult


class ELO:
    def __init__(self) -> None:
        self.DECAY_PER_DAY = 0.99
        self.MAX_AGE_DAYS = 90
        self.TZ_OFFSET_MIN = 0

    def calculate(self, commits: List[CommitData], signals: MLSignals) -> SpikeResult:
        now = datetime.now()

        # Filter and sort commits
        recent: List[CommitData] = []
        for c in commits:
            age_days = (now - c["timestamp"]).days
            if age_days <= self.MAX_AGE_DAYS:
                recent.append(c)

        recent.sort(key=lambda c: c["timestamp"])

        burstiness = self._simple_burstiness(recent)

        total = 0.0
        weight_sum = 0.0

        for c in recent:
            age_days = (now - c["timestamp"]).total_seconds() / 86400
            w = pow(self.DECAY_PER_DAY, age_days)

            spike = self._spike(c, burstiness, signals["stressLevel"])

            total += spike * w
            weight_sum += w

        level_val = total / weight_sum if weight_sum > 0 else 0
        level = int(min(5000, max(0, round(level_val))))

        breakdown: Breakdown = {
            "stressContribution": round(signals["stressLevel"] * 100),
            "lateNightContribution": self._late_night_score(recent),
            "burstContribution": round(burstiness * 100),
            "messageQualityDeduction": round(self._avg_msg_quality(recent) * 100),
        }

        tier = get_tier_from_level(level)

        result: SpikeResult = {
            "glucoseLevel": level,
            "tier": tier,
            "breakdown": breakdown,
            "recommendation": self._get_recommendation(level, signals),
        }

        return result

    def _spike(self, c: CommitData, burst: float, stress_signal: float) -> float:
        changes = c["additions"] + c["deletions"]
        msg_q = self._msg_quality(c["message"])

        s = math.log10(changes + 1) * 8

        stress_mult = self._lerp(0.85, 1.35, stress_signal * (1 - msg_q))
        s *= stress_mult

        # Late night (peaks ~3am)
        hour = self._hour_local(c)
        is_late = hour >= 23 or hour <= 5
        if is_late:
            if hour >= 23:
                factor = self._lerp(0.4, 1.0, (hour - 23) / 5)
            else:
                factor = self._lerp(1.0, 0.6, hour / 5)
            s += 10 * factor

        # Weekend flag — chronic, small
        day = self._day_local(c)
        if day in (0, 6):
            s += 8

        # Burstiness
        s += burst * 15

        return s

    def _simple_burstiness(self, commits: List[CommitData]) -> float:
        if len(commits) < 3:
            return 0.0

        hours: List[float] = []
        for i in range(1, len(commits)):
            diff_h = (
                commits[i]["timestamp"] - commits[i - 1]["timestamp"]
            ).total_seconds() / 3600
            hours.append(max(0.0, diff_h))

        avg = sum(hours) / len(hours)
        variance = sum((h - avg) ** 2 for h in hours) / len(hours)
        sd = math.sqrt(variance)
        cv = sd / avg if avg > 0 else 0

        return min(1.0, cv)

    def _late_night_score(self, commits: List[CommitData]) -> int:
        if not commits:
            return 0

        late = 0
        for c in commits:
            if self._is_late_night(c):
                late += 1

        return min(100, int((late / len(commits)) * 200))

    def _is_late_night(self, c: CommitData) -> bool:
        hour = self._hour_local(c)
        return hour >= 23 or hour <= 5

    def _avg_msg_quality(self, commits: List[CommitData]) -> float:
        if not commits:
            return 0.0

        total = 0.0
        for c in commits:
            total += self._msg_quality(c["message"])

        return total / len(commits)

    def _msg_quality(self, msg: str) -> float:
        score = 0.5

        if len(msg) > 50:
            score += 0.3
        elif len(msg) > 20:
            score += 0.2
        elif len(msg) > 10:
            score += 0.1

        # Check for conventional commit prefixes
        if re.match(r"^(feat|fix|docs|style|refactor|test|chore)", msg, re.IGNORECASE):
            score += 0.2

        if len(msg.split()) < 3:
            score -= 0.2

        return max(0.0, min(1.0, score))

    def _get_recommendation(self, level: int, signals: MLSignals) -> str:
        # TODO: Implement actual recommendations
        if level >= 4000:
            return ""
        if level >= 3000:
            return ""
        if level >= 2000:
            return ""
        return ""

    def _hour_local(self, c: CommitData) -> int:
        adjusted = c["timestamp"] + timedelta(minutes=self.TZ_OFFSET_MIN)
        return adjusted.hour

    def _day_local(self, c: CommitData) -> int:
        adjusted = c["timestamp"] + timedelta(minutes=self.TZ_OFFSET_MIN)
        weekday = adjusted.weekday()  # Monday=0, Sunday=6
        return (weekday + 1) % 7

    def _lerp(self, a: float, b: float, t: float) -> float:
        clamped = max(0.0, min(1.0, t))
        return a + (b - a) * clamped
