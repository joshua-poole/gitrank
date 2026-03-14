from dataclasses import dataclass

import joblib
import torch
from rich import print as rprint
from rich.text import Text
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

from .config import ARTEFACTS_DIR, MODEL

NORMAL_THRESHOLD = 0.3
STRESSED_THRESHOLD = 0.7


@dataclass
class CommitClassification:
    message: str
    score: float
    label: str
    is_stressed: bool
    author: str = "unknown"
    timestamp: str = ""

    def render(self) -> Text:
        color = (
            "red"
            if self.is_stressed
            else "yellow"
            if self.label == "uncertain"
            else "green"
        )
        time_str = f"[{self.timestamp[:10]}] " if self.timestamp else ""
        return Text(
            f"{time_str}{self.score:.4f} [{self.label}] {self.message}", style=color
        )


def classify(
    message: str, clf: LogisticRegression, scaler: StandardScaler
) -> CommitClassification:
    with torch.no_grad():
        emb = MODEL.encode(
            [message], normalize_embeddings=True, convert_to_tensor=False
        )
    score = float(clf.predict_proba(scaler.transform(emb))[0, 1])
    label = (
        "normal"
        if score < NORMAL_THRESHOLD
        else "stressed"
        if score >= STRESSED_THRESHOLD
        else "uncertain"
    )
    return CommitClassification(
        message=message,
        score=round(score, 4),
        label=label,
        is_stressed=score >= STRESSED_THRESHOLD,
    )


if __name__ == "__main__":
    artifact = joblib.load(ARTEFACTS_DIR / "20260314_161301.pkl")
    clf = artifact["model"]
    scaler = artifact["scaler"]

    messages = [
        # "fix bug",
        # "please work",
        # "feat(auth): add login validation",
        # "i have no idea what im doing",
        # "update dependencies",
        # "shit shit shit prod is down",
        # "refactor user model",
        # "yolo",
        # "fixed the schema which was really fun (yay)!",
    ]

    for message in messages:
        result = classify(message, clf, scaler)
        rprint(result.render())
