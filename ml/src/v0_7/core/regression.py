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

from .data import (
    ARTEFACTS_DIR,
    get_signals,
    get_split_embeddings,
    load_embeddings,
)

MODEL_PATH = ARTEFACTS_DIR / f"{datetime.now().strftime('%Y%m%d_%H%M%S')}.pkl"
K_POSITIVE = 20_000
K_NEGATIVE = 10_000


def retrieve_neighbours(
    index: faiss.IndexFlatIP,
    queries: np.ndarray,
    dataset: np.ndarray,
    k: int,
) -> np.ndarray:
    _, indices = index.search(queries, k)
    return dataset[np.unique(indices.flatten())]


def evaluate(
    clf: LogisticRegression,
    scaler: StandardScaler,
    pos_test: np.ndarray,
    neg_test: np.ndarray,
) -> tuple[int, int, float]:
    pos_preds = clf.predict(scaler.transform(pos_test))
    neg_preds = clf.predict(scaler.transform(neg_test))

    y_true = [0] * len(pos_preds) + [1] * len(neg_preds)
    y_pred = list(pos_preds) + list(neg_preds)

    return (
        sum(p == 1 for p in neg_preds),
        sum(p == 0 for p in pos_preds),
        float(f1_score(y_true, y_pred, average="macro")),
    )


if __name__ == "__main__":
    signals = get_signals()
    splits = get_split_embeddings()

    dataset_embs = (
        load_embeddings(
            export_path=ARTEFACTS_DIR / "20260314_130507.pt",
            chunk_size=10_000,
            total_rows=4_336_299,
        )
        .cpu()
        .numpy()
        .astype(np.float32)
    )

    print("Building FAISS index")
    index = faiss.IndexFlatIP(dataset_embs.shape[1])
    index.add(dataset_embs)

    print(
        f"Retrieving top {K_POSITIVE:,} positive / "
        f"top {K_NEGATIVE:,} negative neighbours"
    )
    pos_train_embs = retrieve_neighbours(
        index, splits.pos_train, dataset_embs, K_POSITIVE
    )
    neg_train_embs = retrieve_neighbours(
        index, splits.neg_train, dataset_embs, K_NEGATIVE
    )

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
        clf, scaler, splits.pos_test, splits.neg_test
    )

    rprint(
        f"Negative correctly flagged: "
        f"[bold red]{neg_correct}[/bold red] / {len(signals['negative_test'])}"
    )
    rprint(
        f"Positive correctly passed: "
        f"[bold green]{pos_correct}[/bold green] / {len(signals['positive_test'])}"
    )
    rprint(f"Macro F1: [bold magenta]{macro_f1:.3f}[/bold magenta]")

    rprint("\nFailing positive test signals:")
    pos_preds = clf.predict(scaler.transform(splits.pos_test))
    for sig, pred in zip(signals["positive_test"], pos_preds, strict=True):
        if pred == 1:
            rprint(f"  [red]FAIL[/red] {sig}")

    joblib.dump({"model": clf, "scaler": scaler}, MODEL_PATH)
    rprint(f"Saved to {MODEL_PATH}")
