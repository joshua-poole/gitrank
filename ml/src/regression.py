# ruff: noqa: E501
# Pylance can't resolve FAISS C++ bindings.
# type: ignore[call-arg]

from datetime import datetime

import faiss
import joblib
import numpy as np
from rich import print as rprint
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score
from sklearn.preprocessing import StandardScaler

from .config import (
    ARTEFACTS_DIR,
    get_signals,
    get_test_embeddings,
    get_train_queries,
    load_embeddings,
)

MODEL_PATH = ARTEFACTS_DIR / f"{datetime.now().strftime('%Y%m%d_%H%M%S')}.pkl"
K_POSITIVE = 500
K_NEGATIVE = 500


def evaluate(
    clf: LogisticRegression,
    scaler: StandardScaler,
    neg_embs: np.ndarray,
    pos_embs: np.ndarray,
) -> tuple[int, int, float]:
    neg_preds = clf.predict(scaler.transform(neg_embs))
    pos_preds = clf.predict(scaler.transform(pos_embs))

    neg_correct = sum(1 for p in neg_preds if p == 1)
    pos_correct = sum(1 for p in pos_preds if p == 0)

    y_true = [1] * len(neg_preds) + [0] * len(pos_preds)
    y_pred = list(neg_preds) + list(pos_preds)

    macro_f1 = float(f1_score(y_true, y_pred, average="macro"))
    return neg_correct, pos_correct, macro_f1


if __name__ == "__main__":
    signals = get_signals()
    pos_train_query, neg_train_query = get_train_queries()
    pos_test_embs, neg_test_embs = get_test_embeddings()

    dataset_embs = load_embeddings(
        export_path=ARTEFACTS_DIR / "20260314_130507.pt",
        chunk_size=10_000,
        total_rows=4_336_299,
    )
    dataset_embs_np = dataset_embs.cpu().numpy().astype(np.float32)

    print("Building FAISS index")
    index = faiss.IndexFlatIP(dataset_embs_np.shape[1])  # type: ignore[call-arg]
    index.add(dataset_embs_np)  # type: ignore[call-arg]

    print(f"Retrieving top-{K_POSITIVE} positive neighbours")
    _, pos_indices = index.search(pos_train_query, K_POSITIVE)  # type: ignore[call-arg]
    pos_train_embs = dataset_embs_np[np.unique(pos_indices.flatten())]

    print(f"Retrieving top-{K_NEGATIVE} negative neighbours")
    _, neg_indices = index.search(neg_train_query, K_NEGATIVE)  # type: ignore[call-arg]
    neg_train_embs = dataset_embs_np[np.unique(neg_indices.flatten())]

    rprint(f"Positive training set: [cyan]{len(pos_train_embs):,}[/cyan]")
    rprint(f"Negative training set: [cyan]{len(neg_train_embs):,}[/cyan]")

    X = np.vstack([pos_train_embs, neg_train_embs])
    y = np.array([0] * len(pos_train_embs) + [1] * len(neg_train_embs))

    # Normalize per-dimension variance so no single
    # embedding dimension dominates the decision boundary
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    print("Fitting logistic regression")
    clf = LogisticRegression(max_iter=1000)
    clf.fit(X_scaled, y)

    neg_correct, pos_correct, macro_f1 = evaluate(
        clf, scaler, neg_test_embs, pos_test_embs
    )

    rprint(
        f"Negative correctly flagged: [bold red]{neg_correct}[/bold red] / {len(signals['negative_test'])}"
    )
    rprint(
        f"Positive correctly passed:  [bold green]{pos_correct}[/bold green] / {len(signals['positive_test'])}"
    )
    rprint(f"Macro F1: [bold magenta]{macro_f1:.3f}[/bold magenta]")

    pos_preds = clf.predict(scaler.transform(pos_test_embs))
    rprint("\nFailing positive test signals:")
    for sig, pred in zip(signals["positive_test"], pos_preds, strict=True):
        if pred == 1:
            rprint(f"  [red]FAIL[/red] {sig}")

    joblib.dump({"model": clf, "scaler": scaler}, MODEL_PATH)
    rprint(f"Saved to {MODEL_PATH}")
