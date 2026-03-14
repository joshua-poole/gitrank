# Pylance can't resolve FAISS C++ bindings.
# type: ignore[call-arg]

from itertools import product

import faiss
import joblib
import numpy as np
import torch
from rich import print as rprint
from sklearn.decomposition import PCA
from sklearn.linear_model import SGDOneClassSVM
from sklearn.metrics import f1_score
from sklearn.preprocessing import StandardScaler

from .config import (
    DATA_DIR,
    MODEL,
    NEGATIVE_TEST_SIGNALS,
    POSITIVE_TEST_SIGNALS,
    POSITIVE_TRAIN_SIGNALS,
    load_embeddings,
)

MODEL_PATH = DATA_DIR / "ocsvm.pkl"
DEBUG = True


def build_training_set(
    index: faiss.IndexFlatIP,
    dataset_embs_np: np.ndarray,
    pos_query: np.ndarray,
    k: int,
) -> np.ndarray:
    _, indices = index.search(pos_query, k)
    return dataset_embs_np[np.unique(indices.flatten())]


def fit_ocsvm(
    pos_embeddings: np.ndarray, nu: float, n_components: int
) -> tuple[SGDOneClassSVM, StandardScaler, PCA]:
    scaler = StandardScaler()
    scaled = scaler.fit_transform(pos_embeddings)

    pca = PCA(n_components=n_components)
    reduced = pca.fit_transform(scaled)

    ocsvm = SGDOneClassSVM(nu=nu)
    batch_size = 10_000
    for i in range(0, len(reduced), batch_size):
        ocsvm.partial_fit(reduced[i : i + batch_size])

    return ocsvm, scaler, pca


def evaluate(
    ocsvm: SGDOneClassSVM,
    scaler: StandardScaler,
    pca: PCA,
    neg_embs: np.ndarray,
    pos_embs: np.ndarray,
) -> tuple[int, int, float]:
    neg_preds = ocsvm.predict(pca.transform(scaler.transform(neg_embs)))
    pos_preds = ocsvm.predict(pca.transform(scaler.transform(pos_embs)))

    neg_correct = sum(1 for p in neg_preds if p == -1)
    pos_correct = sum(1 for p in pos_preds if p == 1)

    y_true = [-1] * len(neg_preds) + [1] * len(pos_preds)
    y_pred = list(neg_preds) + list(pos_preds)

    macro_f1 = f1_score(y_true, y_pred, average="macro")
    return neg_correct, pos_correct, macro_f1


if __name__ == "__main__":
    dataset_embs = load_embeddings(
        export_path=DATA_DIR / "20260314_130507.pt",
        chunk_size=10_000,
        total_rows=4_336_299,
    )
    dataset_embs_np = dataset_embs.cpu().numpy().astype(np.float32)

    with torch.no_grad():
        pos_query = MODEL.encode(
            POSITIVE_TRAIN_SIGNALS,
            normalize_embeddings=True,
            convert_to_tensor=False,
            show_progress_bar=True,
        ).astype(np.float32)
        neg_embs = MODEL.encode(
            NEGATIVE_TEST_SIGNALS, normalize_embeddings=True, convert_to_tensor=False
        )
        pos_embs = MODEL.encode(
            POSITIVE_TEST_SIGNALS, normalize_embeddings=True, convert_to_tensor=False
        )

    print("Building FAISS index")
    index = faiss.IndexFlatIP(dataset_embs_np.shape[1])
    index.add(dataset_embs_np)

    if DEBUG:
        with torch.no_grad():
            pos_test_query = MODEL.encode(
                POSITIVE_TEST_SIGNALS,
                normalize_embeddings=True,
                convert_to_tensor=False,
            ).astype(np.float32)

        distances, _ = index.search(pos_test_query, 1)
        rprint("\nPositive test signal nearest neighbour distances:")
        for sig, dist in zip(POSITIVE_TEST_SIGNALS, distances[:, 0], strict=True):
            rprint(f"  [cyan]{dist:.4f}[/cyan] {sig}")

    best_f1 = 0.0
    best_params = (500, 0.1, 64)
    best_model = None

    for k, nu, n_components in product(
        [250, 500, 750, 1000, 1500],
        [0.25, 0.30, 0.35, 0.40, 0.45],
        [32, 64],
    ):
        pos_embeddings = build_training_set(index, dataset_embs_np, pos_query, k)
        ocsvm, scaler, pca = fit_ocsvm(pos_embeddings, nu, n_components)
        neg_correct, pos_correct, macro_f1 = evaluate(
            ocsvm, scaler, pca, neg_embs, pos_embs
        )
        rprint(
            f"K={k:<5} NU={nu:<5} PCA={n_components:<4} "
            f"neg={neg_correct}/{len(NEGATIVE_TEST_SIGNALS)} "
            f"pos={pos_correct}/{len(POSITIVE_TEST_SIGNALS)} "
            f"f1=[bold magenta]{macro_f1:.3f}[/bold magenta]"
        )
        if macro_f1 > best_f1:
            best_f1 = macro_f1
            best_params = (k, nu, n_components)
            best_model = (ocsvm, scaler, pca)

    rprint(
        f"\nBest: K={best_params[0]} NU={best_params[1]} "
        f"PCA={best_params[2]} F1={best_f1:.3f}"
    )

    ocsvm, scaler, pca = best_model
    pos_preds = ocsvm.predict(pca.transform(scaler.transform(pos_embs)))

    rprint("\nFailing positive test signals:")
    for sig, pred in zip(POSITIVE_TEST_SIGNALS, pos_preds, strict=True):
        if pred == -1:
            rprint(f"[red]FAIL[/red] {sig}")

    joblib.dump({"model": ocsvm, "scaler": scaler, "pca": pca}, MODEL_PATH)
    rprint(f"Saved to {MODEL_PATH}")
