FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_CACHE_DIR=/tmp/uv-cache

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

# Install dependencies
COPY app/pyproject.toml app/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

# Copy source and artefacts
COPY app/src/ src/
COPY app/artefacts/ artefacts/

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

# Copy only the venv, source, and artefacts from the builder
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/src /app/src
COPY --from=builder /app/artefacts /app/artefacts

ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--app-dir", "src"]
