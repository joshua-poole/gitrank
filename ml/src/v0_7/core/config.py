from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
ARTEFACTS_DIR = Path(__file__).resolve().parents[2] / "artefacts"
ONNX_MODEL_DIR = ARTEFACTS_DIR / "onnx_model"
