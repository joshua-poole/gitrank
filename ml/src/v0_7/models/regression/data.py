import json
import random
from pathlib import Path
from typing import NamedTuple

import numpy as np
import polars as pl
import torch
from rich import print as rprint
from sentence_transformers import SentenceTransformer

from v0_7.core import ARTEFACTS_DIR, DATA_DIR, DEVICE
from v0_7.core.utils import timestamp

DATASET_PATH = DATA_DIR / "dhruvildave_github-commit-messages-dataset.csv"
SIGNALS_PATH = DATA_DIR / "signals.json"
TRUNCATE_SIZE = 100

MODEL = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2", device=DEVICE)
MODEL.to(torch.float16)
MODEL = torch.compile(MODEL, mode="reduce-overhead")


class SplitSignals(NamedTuple):
    pos_train: list[str]
    pos_test: list[str]
    neg_train: list[str]
    neg_test: list[str]


def _create_embeddings_file(batch_size: int = 4096, export_path: Path | None = None):
    df = (
        pl.scan_csv(DATASET_PATH)
        .select(pl.col("message").fill_null("").str.slice(0, TRUNCATE_SIZE))
        .collect()
    )
    messages = df["message"].to_numpy()
    rprint(f"[bold green]Dataset Row Count:[/bold green] {len(messages):,}")

    with torch.inference_mode():
        embs = MODEL.encode(
            messages,
            batch_size=batch_size,
            show_progress_bar=True,
            convert_to_tensor=True,
            normalize_embeddings=True,
        ).cpu()

    if export_path is None:
        export_path = ARTEFACTS_DIR / f"{timestamp()}_embeddings.pt"

    torch.save(embs.half(), export_path)
    rprint(f"[bold green]Saved embeddings to[/bold green] '{export_path}'")
    return embs.half()


def encode(
    messages: str | list[str], batch_size: int = 4096, verbose: bool = False
) -> np.ndarray:
    if isinstance(messages, str):
        messages = [messages]

    messages = [m[:TRUNCATE_SIZE] for m in messages]
    with torch.inference_mode():
        embs = MODEL.encode(
            messages,
            normalize_embeddings=True,
            convert_to_tensor=True,
            show_progress_bar=verbose,
            batch_size=batch_size,
        )
        return embs.to(torch.float32).cpu().numpy()


def load_raw_embs(embs_path: Path) -> np.ndarray:
    if not embs_path.exists():
        rprint("[bold green]Creating new embeddings file[/bold green]")
        return _create_embeddings_file(export_path=embs_path).to(torch.float32).numpy()

    rprint(f"[bold green]Loading cached embeddings from[/bold green] '{embs_path}'")
    return (
        torch.load(embs_path, map_location="cpu", weights_only=True)
        .to(torch.float32)
        .numpy()
    )


def load_split_signals(seed: int = 42, split_ratio: float = 0.7) -> SplitSignals:
    signals = json.loads(SIGNALS_PATH.read_text())
    pos_signals = [
        msg for source in signals.get("positive", []) for msg in signals.get(source, [])
    ]
    neg_signals = [
        msg for source in signals.get("negative", []) for msg in signals.get(source, [])
    ]

    rng = random.Random(seed)
    rng.shuffle(pos_signals)
    rng.shuffle(neg_signals)

    pos_idx = int(len(pos_signals) * split_ratio)
    neg_idx = int(len(neg_signals) * split_ratio)

    return SplitSignals(
        pos_signals[:pos_idx],
        pos_signals[pos_idx:],
        neg_signals[:neg_idx],
        neg_signals[neg_idx:],
    )


if __name__ == "__main__":
    load_raw_embs(embs_path=ARTEFACTS_DIR / "20260314_221349_embeddings.pt")
