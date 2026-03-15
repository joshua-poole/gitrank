FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_CACHE_DIR=/tmp/uv-cache

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

# Install dependencies
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

# Copy source and pre-warm the ONNX model export
COPY src/ src/
RUN uv run --directory src python -c "\
from v0_7.models.regression.data import _model, _tokenizer; \
print('ONNX model ready')"

# Clean all caches to shrink the image
RUN rm -rf /tmp/uv-cache \
    && rm -rf /root/.cache/huggingface \
    && rm -rf /root/.cache/pip \
    && find /app/.venv -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null; true

# ── Runtime stage ─────────────────────────────────────────────
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Copy only the venv and source from the builder
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/src /app/src

ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "v0_7.main:app", "--host", "0.0.0.0", "--port", "8000", "--app-dir", "src"]
