# ruff: noqa: E501

from itertools import product

import joblib
import numpy as np
import torch
from rich import print as rprint
from sklearn.decomposition import IncrementalPCA
from sklearn.ensemble import IsolationForest
from sklearn.metrics import f1_score
from sklearn.preprocessing import StandardScaler

from .config import (
    DATA_DIR,
    MODEL,
    NEGATIVE_TEST_SIGNALS,
    POSITIVE_TEST_SIGNALS,
    load_embeddings,
)

MODEL_PATH = DATA_DIR / "iforest.pkl"


def evaluate(
    clf: IsolationForest,
    scaler: StandardScaler,
    pca: IncrementalPCA,
    neg_embs: np.ndarray,
    pos_embs: np.ndarray,
) -> tuple[int, int, float]:
    neg_preds = clf.predict(pca.transform(scaler.transform(neg_embs)))
    pos_preds = clf.predict(pca.transform(scaler.transform(pos_embs)))

    neg_correct = sum(1 for p in neg_preds if p == -1)
    pos_correct = sum(1 for p in pos_preds if p == 1)

    y_true = [-1] * len(neg_preds) + [1] * len(pos_preds)
    y_pred = list(neg_preds) + list(pos_preds)

    macro_f1 = float(f1_score(y_true, y_pred, average="macro"))
    return neg_correct, pos_correct, macro_f1


if __name__ == "__main__":
    dataset_embs = load_embeddings(
        export_path=DATA_DIR / "20260314_130507.pt",
        chunk_size=10_000,
        total_rows=4_336_299,
    )
    dataset_embs_np = dataset_embs.cpu().numpy().astype(np.float32)

    with torch.no_grad():
        neg_embs = MODEL.encode(
            NEGATIVE_TEST_SIGNALS, normalize_embeddings=True, convert_to_tensor=False
        )
        pos_embs = MODEL.encode(
            POSITIVE_TEST_SIGNALS, normalize_embeddings=True, convert_to_tensor=False
        )

    print("Fitting scaler")
    scaler = StandardScaler()
    batch_size = 100_000
    for i in range(0, len(dataset_embs_np), batch_size):
        scaler.partial_fit(dataset_embs_np[i : i + batch_size])
    scaled = scaler.transform(dataset_embs_np)

    pcas: dict[int, tuple[IncrementalPCA, np.ndarray]] = {}
    for n_components in [32, 64, 128]:
        print(f"Fitting PCA n_components={n_components}")
        pca = IncrementalPCA(n_components=n_components, batch_size=10_000)
        pca.fit(scaled)
        pcas[n_components] = (pca, pca.transform(scaled))

    best_f1 = 0.0
    best_params = (0.1, 64)
    best_model = None

    for contamination, n_components in product(
        [0.05, 0.10, 0.15, 0.20, 0.25],
        [32, 64, 128],
    ):
        pca, reduced = pcas[n_components]
        clf = IsolationForest(contamination=contamination, random_state=42, n_jobs=-1)
        clf.fit(reduced)
        neg_correct, pos_correct, macro_f1 = evaluate(
            clf, scaler, pca, neg_embs, pos_embs
        )
        rprint(
            f"contamination={contamination:<5} PCA={n_components:<4} "
            f"neg={neg_correct}/{len(NEGATIVE_TEST_SIGNALS)} "
            f"pos={pos_correct}/{len(POSITIVE_TEST_SIGNALS)} "
            f"f1=[bold magenta]{macro_f1:.3f}[/bold magenta]"
        )
        if macro_f1 > best_f1:
            best_f1 = macro_f1
            best_params = (contamination, n_components)
            best_model = (clf, scaler, pca)

    rprint(
        f"\nBest: contamination={best_params[0]} PCA={best_params[1]} F1={best_f1:.3f}"
    )

    print("Refitting best model with n_estimators=100")
    pca, reduced = pcas[best_params[1]]
    clf = IsolationForest(
        contamination=best_params[0], n_estimators=100, random_state=42, n_jobs=-1
    )
    clf.fit(reduced)

    pos_preds = clf.predict(pca.transform(scaler.transform(pos_embs)))
    rprint("\nFailing positive test signals:")
    for sig, pred in zip(POSITIVE_TEST_SIGNALS, pos_preds, strict=True):
        if pred == -1:
            rprint(f"  [red]FAIL[/red] {sig}")

    joblib.dump({"model": clf, "scaler": scaler, "pca": pca}, MODEL_PATH)
    rprint(f"Saved to {MODEL_PATH}")
