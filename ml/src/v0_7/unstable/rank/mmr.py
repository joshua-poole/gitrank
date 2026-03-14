from datetime import UTC, datetime, timedelta

import numpy as np
import pandas as pd
from rich import print as rprint

from v0_7.core.config import ARTEFACTS_DIR
from v0_7.metrics.performance import calc_performance_vector
from v0_7.models.regression.pipeline import SentimentRegressionPipeline
from v0_7.unstable.github.commits import get_user_commits

BASE_MMR = 1000.0
MAX_MMR = 7000.0


DIVISION_NAMES = [
    "Plastic",
    "Bronze",
    "Silver",
    "Gold",
    "Platinum",
    "Diamond",
    "Not Showered In Years",
]
DIVISION_COLOURS = [
    "white",
    "dark_orange",
    "bright_white",
    "bold yellow",
    "cyan",
    "bold cyan",
    "bold magenta",
]

SUB_DIVISIONS = [(0.33, "III"), (0.66, "II"), (1.0, "I")]

step = MAX_MMR / len(DIVISION_NAMES)
DIVISIONS = {
    name: (int(i * step), int((i + 1) * step), colour)
    for i, (name, colour) in enumerate(
        zip(DIVISION_NAMES, DIVISION_COLOURS, strict=True)
    )
}

MAX_DAILY_MMR_GAIN = 100.0
INACTIVITY_PENALTY = MAX_DAILY_MMR_GAIN * 0.15


def calc_actual(performance: dict) -> float:
    return (
        performance["commit_score"] * 0.3
        + performance["commit_frequency"] * 0.3
        + performance["commit_consistency"] * 0.4
    )


def calc_mmr_delta(current_mmr: float, performance: dict | None) -> float:
    if performance is None:
        return -INACTIVITY_PENALTY
    expected = current_mmr / MAX_MMR
    actual = calc_actual(performance)
    return MAX_DAILY_MMR_GAIN * (actual - expected)


def update_mmr(current_mmr: float, performance: dict | None) -> float:
    delta = calc_mmr_delta(current_mmr, performance)
    return float(np.clip(current_mmr + delta, 0, MAX_MMR))


def get_daily_window(date: datetime) -> tuple[datetime, datetime]:
    since = date.replace(hour=0, minute=0, second=0, microsecond=0)
    until = since + timedelta(days=1)
    return since, until


def get_division(mmr: float) -> tuple[str, str]:
    for division, (low, high, colour) in DIVISIONS.items():
        if low <= mmr < high:
            segment = (mmr - low) / (high - low)
            sub = next(s for threshold, s in SUB_DIVISIONS if segment < threshold)
            return f"{division} {sub}", colour
    return f"{DIVISION_NAMES[-1]} I", DIVISION_COLOURS[-1]


def rprint_division(user: str, mmr: float) -> None:
    division, colour = get_division(mmr)
    delta = mmr - BASE_MMR
    delta_str = (
        f"[bold green]{delta:+.1f}[/bold green]"
        if delta >= 0
        else f"[bold red]{delta:+.1f}[/bold red]"
    )
    rprint(f"{user:<20} [{colour}]{division}[/{colour}] {mmr:.1f} MMR ({delta_str})")


if __name__ == "__main__":
    pipeline = SentimentRegressionPipeline()
    pipeline.load_model(model_path=ARTEFACTS_DIR / "20260315_031701_model.pkl")

    users = [
        "torvalds",
        "joshua-poole",
        "NathanTheDev",
        "imareeq",
        "hello-andrew-yan",
        "kmyria",
        "jami303",
    ]
    mmr = {user: BASE_MMR for user in users}

    start = datetime(2026, 1, 1, tzinfo=UTC)
    today = datetime.now(UTC)

    rprint(f"Base MMR: {BASE_MMR:.1f}")

    user_commits: dict[str, pd.DataFrame] = {}
    for user in users:
        df = get_user_commits(user, start, today)
        if not df.empty:
            df["day"] = df["date"].dt.date
        user_commits[user] = df

    current = start
    while current < today:
        day = current.date()
        for user in users:
            df = user_commits[user]
            day_df = df[df["day"] == day] if not df.empty else pd.DataFrame()
            performance = (
                calc_performance_vector(day_df, pipeline, days=1)
                if not day_df.empty
                else None
            )
            delta = calc_mmr_delta(mmr[user], performance)
            mmr[user] = update_mmr(mmr[user], performance)
        current += timedelta(days=1)

    for user, score in sorted(mmr.items(), key=lambda x: x[1], reverse=True):
        rprint_division(user, score)
