from pathlib import Path

import torch

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
ARTEFACTS_DIR = Path(__file__).resolve().parents[2] / "artefacts"

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
