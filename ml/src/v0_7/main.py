import logging
from contextlib import asynccontextmanager
from datetime import UTC, datetime, timedelta
from functools import lru_cache

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from v0_7.core.config import ARTEFACTS_DIR
from v0_7.metrics.performance import calc_performance_vector
from v0_7.models.regression.pipeline import SentimentRegressionPipeline
from v0_7.unstable.github.commits import get_user_commits

LOGGER = logging.getLogger("uvicorn")


@lru_cache(maxsize=1)
def get_pipeline() -> SentimentRegressionPipeline:
    pipeline = SentimentRegressionPipeline()
    pipeline.load_model(model_path=ARTEFACTS_DIR / "latest.pkl")
    return pipeline


@asynccontextmanager
async def _lifespan(_: FastAPI):
    LOGGER.info("Commit quality service started. Loading model.")
    get_pipeline()
    yield
    LOGGER.info("Commit quality service shutting down.")


app = FastAPI(
    title="Commit Quality Service",
    lifespan=_lifespan,
)

app.add_middleware(TrustedHostMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/commits/score", include_in_schema=True)
async def get_user_commit_score(user: str, since: datetime, until: datetime):
    since = datetime.now(UTC) - timedelta(days=180)
    until = datetime.now(UTC)
    num_days = (until - since).days

    df = get_user_commits(user, since, until)
    return calc_performance_vector(df, get_pipeline(), num_days)
