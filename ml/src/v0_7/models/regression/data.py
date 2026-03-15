import json
import random
from pathlib import Path
from typing import NamedTuple

import numpy as np
from rich import print as rprint
from transformers import AutoTokenizer
from optimum.onnxruntime import ORTModelForFeatureExtraction

from v0_7.core import ARTEFACTS_DIR, DATA_DIR, ONNX_MODEL_DIR

DATASET_PATH = DATA_DIR / "dhruvildave_github-commit-messages-dataset.csv"
SIGNALS_PATH = DATA_DIR / "signals.json"
TRUNCATE_SIZE = 100

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
_tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
_model = ORTModelForFeatureExtraction.from_pretrained(
    ONNX_MODEL_DIR if ONNX_MODEL_DIR.exists() else MODEL_NAME,
    export=not ONNX_MODEL_DIR.exists(),
)

# Save locally on first run so subsequent loads skip the export
if not ONNX_MODEL_DIR.exists():
    _model.save_pretrained(ONNX_MODEL_DIR)
    _tokenizer.save_pretrained(ONNX_MODEL_DIR)


def _mean_pooling(token_embeddings: np.ndarray, attention_mask: np.ndarray) -> np.ndarray:
    mask_expanded = np.expand_dims(attention_mask, axis=-1).astype(np.float32)
    summed = np.sum(token_embeddings * mask_expanded, axis=1)
    counts = np.clip(mask_expanded.sum(axis=1), a_min=1e-9, a_max=None)
    return summed / counts


def _normalize(embeddings: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    return embeddings / np.clip(norms, a_min=1e-9, a_max=None)


class SplitSignals(NamedTuple):
    pos_train: list[str]
    pos_test: list[str]
    neg_train: list[str]
    neg_test: list[str]


def _encode_batch(messages: list[str], batch_size: int = 256, verbose: bool = False) -> np.ndarray:
    all_embeddings = []
    for i in range(0, len(messages), batch_size):
        batch = messages[i : i + batch_size]
        inputs = _tokenizer(batch, padding=True, truncation=True, max_length=128, return_tensors="np")
        outputs = _model(**{k: v for k, v in inputs.items()})
        token_embs = outputs.last_hidden_state
        if not isinstance(token_embs, np.ndarray):
            token_embs = np.array(token_embs)
        pooled = _mean_pooling(token_embs, inputs["attention_mask"])
        all_embeddings.append(pooled)
        if verbose and (i % (batch_size * 10) == 0):
            rprint(f"  Encoded {i + len(batch):,} / {len(messages):,}")
    return _normalize(np.vstack(all_embeddings).astype(np.float32))


def _create_embeddings_file(batch_size: int = 256, export_path: Path | None = None):
    import polars as pl

    df = (
        pl.scan_csv(DATASET_PATH)
        .select(pl.col("message").fill_null("").str.slice(0, TRUNCATE_SIZE))
        .collect()
    )
    messages = df["message"].to_list()
    rprint(f"[bold green]Dataset Row Count:[/bold green] {len(messages):,}")

    embs = _encode_batch(messages, batch_size=batch_size, verbose=True)

    if export_path is None:
        from v0_7.core.utils import timestamp
        export_path = ARTEFACTS_DIR / f"{timestamp()}_embeddings.npy"

    np.save(export_path, embs.astype(np.float16))
    rprint(f"[bold green]Saved embeddings to[/bold green] '{export_path}'")
    return embs


def encode(
    messages: str | list[str], batch_size: int = 256, verbose: bool = False
) -> np.ndarray:
    if isinstance(messages, str):
        messages = [messages]

    messages = [m[:TRUNCATE_SIZE] for m in messages]
    return _encode_batch(messages, batch_size=batch_size, verbose=verbose)


def load_raw_embs(embs_path: Path) -> np.ndarray:
    if not embs_path.exists():
        rprint("[bold green]Creating new embeddings file[/bold green]")
        return _create_embeddings_file(export_path=embs_path)

    rprint(f"[bold green]Loading cached embeddings from[/bold green] '{embs_path}'")
    suffix = embs_path.suffix

    if suffix == ".npy":
        return np.load(embs_path).astype(np.float32)

    # Support loading legacy .pt files (requires torch)
    if suffix == ".pt":
        import torch
        return (
            torch.load(embs_path, map_location="cpu", weights_only=True)
            .to(torch.float32)
            .numpy()
        )

    raise ValueError(f"Unsupported embedding file format: {suffix}")


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
