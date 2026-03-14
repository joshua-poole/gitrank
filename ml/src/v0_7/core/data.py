import json
import random
from functools import lru_cache
from pathlib import Path
from typing import NamedTuple

import numpy as np
import pandas as pd
import torch
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
ARTEFACTS_DIR = Path(__file__).resolve().parents[2] / "artefacts"
DATASET_PATH = DATA_DIR / "dhruvildave_github-commit-messages-dataset.csv"

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MODEL = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2", device=DEVICE)

SPLIT_RATIO = 0.7


class SplitEmbeddings(NamedTuple):
    pos_train: np.ndarray
    neg_train: np.ndarray
    pos_test: np.ndarray
    neg_test: np.ndarray


def load_embeddings(
    export_path: Path,
    chunk_size: int,
    total_rows: int | None = None,
    batch_size: int = 1024,
    truncate_length: int = 100,
) -> torch.Tensor:
    if export_path.exists():
        print("Loading cached embeddings")
        return torch.load(export_path)

    print("Calculating embeddings")
    chunks = []
    for chunk in tqdm(
        pd.read_csv(DATASET_PATH, chunksize=chunk_size, usecols=["message"]),
        total=(total_rows // chunk_size) if total_rows else None,
    ):
        msgs = (
            chunk["message"]
            .fillna("")
            .str.strip()
            .str.replace(r"\s+", " ", regex=True)
            .str[:truncate_length]
            .tolist()
        )
        if not msgs:
            continue
        with torch.no_grad():
            chunks.append(
                MODEL.encode(
                    msgs,
                    normalize_embeddings=True,
                    batch_size=batch_size,
                    show_progress_bar=False,
                    convert_to_tensor=True,
                )
            )

    embs = torch.cat(chunks)
    torch.save(embs, export_path)
    return embs


@lru_cache(maxsize=1)
def get_signals() -> dict:
    random.seed(42)
    signals = json.loads((DATA_DIR / "signals.json").read_text())
    positive_all = [msg for key in signals["positive_sources"] for msg in signals[key]]
    negative_all = [msg for key in signals["negative_sources"] for msg in signals[key]]
    random.shuffle(positive_all)
    random.shuffle(negative_all)
    pos_split = int(len(positive_all) * SPLIT_RATIO)
    neg_split = int(len(negative_all) * SPLIT_RATIO)
    return {
        "positive_train": positive_all[:pos_split],
        "positive_test": positive_all[pos_split:],
        "negative_train": negative_all[:neg_split],
        "negative_test": negative_all[neg_split:],
    }


def _encode(messages: list[str]) -> np.ndarray:
    with torch.no_grad():
        return MODEL.encode(
            messages,
            normalize_embeddings=True,
            convert_to_tensor=False,
            show_progress_bar=True,
        ).astype(np.float32)


@lru_cache(maxsize=1)
def get_split_embeddings() -> SplitEmbeddings:
    signals = get_signals()
    return SplitEmbeddings(
        _encode(signals["positive_train"]),
        _encode(signals["negative_train"]),
        _encode(signals["positive_test"]),
        _encode(signals["negative_test"]),
    )
