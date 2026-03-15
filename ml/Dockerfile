FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install uv for fast dependency resolution
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

# Install dependencies first (cached layer)
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

# Copy source code and model artefacts
COPY src/ src/

# The ONNX model is auto-exported on first run if not present.
# To avoid a slow first request, pre-warm it during build:
RUN uv run python -c "\
from v0_7.models.regression.data import _model, _tokenizer; \
print('ONNX model ready')" \
    --directory src

EXPOSE 8000

CMD ["uv", "run", "--directory", "src", "uvicorn", "v0_7.main:app", "--host", "0.0.0.0", "--port", "8000"]
