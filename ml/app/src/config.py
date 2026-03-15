import os
from pathlib import Path

from dotenv import load_dotenv
from gql import Client
from gql.transport.requests import RequestsHTTPTransport

load_dotenv()

ARTEFACTS_DIR = Path(__file__).parents[1] / "artefacts"
ARTEFACTS_DIR.mkdir(parents=True, exist_ok=True)

_TOKEN = os.environ["GITHUB_TOKEN"]
_TRANSPORT = RequestsHTTPTransport(
    url="https://api.github.com/graphql",
    headers={"Authorization": f"Bearer {_TOKEN}"},
)
GRAPHQL_CLIENT = Client(transport=_TRANSPORT, fetch_schema_from_transport=False)
