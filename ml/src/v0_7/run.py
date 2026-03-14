from dataclasses import dataclass, field
from typing import ClassVar

import joblib
import torch
from rich import print as rprint
from rich.text import Text
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

from .core.data import ARTEFACTS_DIR, MODEL


@dataclass
class CommitPerformance:
    GOOD_THRESHOLD: ClassVar[float] = 0.3
    POOR_THRESHOLD: ClassVar[float] = 0.7

    message: str
    score: float
    label: str
    is_poor: bool

    @classmethod
    def assess(
        cls, message: str, clf: LogisticRegression, scaler: StandardScaler
    ) -> "CommitPerformance":
        with torch.no_grad():
            emb = MODEL.encode(
                [message], normalize_embeddings=True, convert_to_tensor=False
            )
        score = float(clf.predict_proba(scaler.transform(emb))[0, 1])
        label = (
            "poor"
            if score >= cls.POOR_THRESHOLD
            else "good"
            if score < cls.GOOD_THRESHOLD
            else "mixed"
        )
        return cls(
            message=message,
            score=round(score, 4),
            label=label,
            is_poor=score >= cls.POOR_THRESHOLD,
        )

    def render(self) -> Text:
        color = (
            "red"
            if self.is_poor
            else "yellow"
            if self.label == "mixed"
            else "green"
        )
        return Text(
            f"[{self.label}] {self.score:.4f} > {self.message}", style=color
        )


if __name__ == "__main__":
    artifact = joblib.load(ARTEFACTS_DIR / "20260314_173052.pkl")
    clf, scaler = artifact["model"], artifact["scaler"]

    messages = [
        "fix bug",
        "please work",
        "feat(auth): add login validation",
        "i have no idea what im doing",
        "update dependencies",
        "shit shit shit prod is down",
        "refactor user model",
        "yolo",
        "fixed the schema which was really fun (yay)!",
    ]

    results = [CommitPerformance.assess(msg, clf, scaler) for msg in messages]
    for result in sorted(results, key=lambda r: r.score):
        rprint(result.render())
