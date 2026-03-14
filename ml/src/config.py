import json
import random
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
DATASET_PATH = DATA_DIR / "dhruvildave_github-commit-messages-dataset.csv"

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MODEL = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2", device=DEVICE)


def load_embeddings(
    chunk_size: int,
    export_path: Path | None = None,
    total_rows: int | None = None,
    batch_size: int = 1024,
) -> torch.Tensor:
    if export_path is None:
        export_path = DATA_DIR / f"{datetime.now().strftime('%Y%m%d_%H%M%S')}.pt"

    if export_path.exists():
        print("Loading cached embeddings")
        return torch.load(export_path, map_location=DEVICE)

    print("Computing embeddings")
    total_chunks = (total_rows // chunk_size) if total_rows is not None else None
    chunks = []
    for chunk in tqdm(
        pd.read_csv(DATASET_PATH, chunksize=chunk_size, usecols=["message"]),
        total=total_chunks,
    ):
        msgs = (
            chunk["message"]
            .fillna("")
            .str.strip()
            .str.replace(r"\s+", " ", regex=True)
            .str[:100]
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
                ).cpu()
            )
    embs = torch.cat(chunks)
    torch.save(embs, export_path)
    return embs.to(DEVICE)


def load_messages(
    export_path: Path | None = None,
) -> np.ndarray:
    if export_path is None:
        export_path = DATA_DIR / f"{datetime.now().strftime('%Y%m%d_%H%M%S')}.npy"

    if export_path.exists():
        print("Loading cached messages")
        return np.load(export_path, allow_pickle=True)

    print("Computing messages")
    msgs = (
        pd.read_csv(DATASET_PATH, usecols=["message"])["message"]
        .fillna("")
        .str.strip()
        .to_numpy(dtype=object)
    )
    np.save(export_path, msgs)
    return msgs


SPIT_RATIO = 0.7

random.seed(42)
signals = json.loads((DATA_DIR / "signals.json").read_text())
positive_all = [
    msg for key in signals["positive_train_sources"] for msg in signals[key]
]
random.shuffle(positive_all)

split = int(len(positive_all) * SPIT_RATIO)
POSITIVE_TRAIN_SIGNALS = positive_all[:split]
POSITIVE_TEST_SIGNALS = positive_all[split:]
NEGATIVE_TEST_SIGNALS = signals["negative_test_examples"]
