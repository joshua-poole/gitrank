# Pylance can't resolve FAISS C++ bindings.
# type: ignore[call-arg]

from pathlib import Path

import faiss
import joblib
import numpy as np
import torch
from rich import print as rprint
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score
from sklearn.pipeline import Pipeline, make_pipeline
from sklearn.preprocessing import StandardScaler

from v0_7.core import ARTEFACTS_DIR
from v0_7.core.utils import timestamp

from .data import SplitSignals, encode, load_raw_embs, load_split_signals


class SentimentRegressionPipeline:
    raw_embs: torch.Tensor = None
    index: faiss.IndexFlatIP
    split: SplitSignals = None
    X: np.ndarray = None
    y: np.ndarray = None
    clf: Pipeline = None

    def _retrieve_neighbours(
        self, queries: np.ndarray, dataset: np.ndarray, k: int
    ) -> np.ndarray:
        if self.raw_embs is None:
            raise RuntimeError("Dataset not loaded. Call load_dataset() first")
        _, indices = self.index.search(queries, k)
        return dataset[np.unique(indices.flatten())]

    def load_model(self, model_path: Path):
        if not model_path.exists():
            raise FileNotFoundError(f"No model found at {model_path}")

        payload = joblib.load(model_path)
        if "model" not in payload:
            raise ValueError(f"Invalid model file at {model_path}")

        self.clf = payload["model"]
        rprint(
            f"[bold green]Model successfully loaded from[/bold green] '{model_path}'"
        )

    def load_dataset(
        self, embs_path: Path, split_ratio: float, k_positive: int, k_negative: int
    ):

        if self.raw_embs is None:
            self.raw_embs = load_raw_embs(embs_path)
            self.index = faiss.IndexFlatIP(self.raw_embs.shape[1])
            self.index.add(self.raw_embs)

        self.split = load_split_signals(split_ratio=split_ratio)
        print(
            f"Retrieving top {k_positive:,} positive "
            f"and top {k_negative:,} negative neighbours"
        )
        pos_train_embs = self._retrieve_neighbours(
            encode(self.split.pos_train), self.raw_embs, k_positive
        )
        neg_train_embs = self._retrieve_neighbours(
            encode(self.split.neg_train), self.raw_embs, k_negative
        )

        self.X = np.vstack([pos_train_embs, neg_train_embs])
        self.y = np.array([1] * len(pos_train_embs) + [0] * len(neg_train_embs))

    def train(self, max_iter: int = 1000):
        if self.X is None or self.y is None:
            raise RuntimeError("Dataset not loaded. Call load_dataset() first")

        print("Training model")
        clf = make_pipeline(StandardScaler(), LogisticRegression(max_iter=max_iter))
        clf.fit(self.X, self.y)
        self.clf = clf

    def eval(self):
        if self.raw_embs is None:
            raise RuntimeError("Dataset not loaded. Call load_dataset() first")

        print("Evaluating model")
        pos_test_embs = encode(self.split.pos_test)
        neg_test_embs = encode(self.split.neg_test)

        pos_preds = self.clf.predict(pos_test_embs)
        neg_preds = self.clf.predict(neg_test_embs)

        y_true = [1] * len(pos_preds) + [0] * len(neg_preds)
        y_pred = list(pos_preds) + list(neg_preds)

        neg_correct = sum(p == 0 for p in neg_preds)
        pos_correct = sum(p == 1 for p in pos_preds)
        macro_f1 = float(f1_score(y_true, y_pred, average="macro"))

        rprint(
            f"Negative correctly flagged: "
            f"[bold red]{neg_correct}[/bold red] / {len(self.split.neg_test)}"
        )
        rprint(
            f"Positive correctly passed: "
            f"[bold green]{pos_correct}[/bold green] / {len(self.split.pos_test)}"
        )
        rprint(f"Macro F1: [bold magenta]{macro_f1:.3f}[/bold magenta]")

        rprint("Failing positive test signals:")
        for sig, pred in zip(self.split.pos_test, pos_preds, strict=True):
            if pred == 0:
                rprint(f"- [red]{sig}[/red] ")

    def save(self, export_path: Path | None = None):
        if self.clf is None:
            raise RuntimeError("Model not initialised. Call train() first")

        if export_path is None:
            export_path = ARTEFACTS_DIR / f"{timestamp()}_model.pkl"

        joblib.dump({"model": self.clf}, export_path)
        rprint(f"[bold green]Saved model to[/bold green] '{export_path}'")

    def score(self, message: str | list[str]) -> float | list[float]:
        if self.clf is None:
            raise RuntimeError(
                "Model not initialised. Call train() or load_model() first"
            )
        if isinstance(message, str):
            return float(self.clf.predict_proba(encode([message]))[0, 1])

        return self.clf.predict_proba(encode(message))[:, 1].tolist()


if __name__ == "__main__":
    pipeline = SentimentRegressionPipeline()

    # pipeline.load_dataset(
    #     embs_path=ARTEFACTS_DIR / "20260314_221349_embeddings.pt",
    #     split_ratio=0.7,
    #     k_positive=20_000,
    #     k_negative=10_000,
    # )
    # pipeline.train()
    # pipeline.eval()
    # pipeline.save()

    pipeline.load_model(model_path=ARTEFACTS_DIR / "20260315_031701_model.pkl")
    rprint(pipeline.score("Test"))
    rprint(pipeline.score("feat: Updated README.md"))
