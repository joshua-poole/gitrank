# ruff: noqa: E501

import os
from datetime import UTC, datetime, timedelta

import joblib
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from gql import Client, gql
from gql.transport.requests import RequestsHTTPTransport
from rich import print as rprint
from sklearn.discriminant_analysis import StandardScaler
from sklearn.linear_model import LogisticRegression

from v0_7.core import ARTEFACTS_DIR
from v0_7.models.regression.legacy.train import score

load_dotenv()

TOKEN = os.environ["GITHUB_TOKEN"]
TRANSPORT = RequestsHTTPTransport(
    url="https://api.github.com/graphql",
    headers={"Authorization": f"Bearer {TOKEN}"},
)
CLIENT = Client(transport=TRANSPORT, fetch_schema_from_transport=True)

REPOS_AFFILIATION_QUERY = gql("""
query($username: String!) {
  user(login: $username) {
    repositories(
      first: 100,
      affiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER],
      ownerAffiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER],
      orderBy: {field: PUSHED_AT, direction: DESC}
    ) {
      nodes {
        nameWithOwner
        pushedAt  # We need this to filter in Python
      }
    }
  }
}
""")

GET_ALL_BRANCH_COMMITS_QUERY = gql("""
query($owner: String!, $name: String!, $authorId: ID!, $since: GitTimestamp!, $until: GitTimestamp!) {
  repository(owner: $owner, name: $name) {
    refs(refPrefix: "refs/heads/", first: 50) {
      nodes {
        name
        target {
          ... on Commit {
            history(author: {id: $authorId}, since: $since, until: $until, first: 100) {
              nodes {
                oid
                message
                committedDate
              }
            }
          }
        }
      }
    }
  }
}
""")


def _get_filtered_repos(username: str, since: datetime, until: datetime):
    result = CLIENT.execute(
        REPOS_AFFILIATION_QUERY, variable_values={"username": username}
    )
    user_data = result.get("user")
    if not user_data:
        return []

    nodes = user_data.get("repositories", {}).get("nodes", [])
    filtered_names = []
    for repo in nodes:
        if not repo.get("pushedAt"):
            continue

        push_time = datetime.fromisoformat(repo["pushedAt"].replace("Z", "+00:00"))
        if since <= push_time <= until:
            filtered_names.append(repo["nameWithOwner"])

    return filtered_names


def _get_my_id(username: str):
    query = gql("query($login: String!) { user(login: $login) { id } }")
    result = CLIENT.execute(query, variable_values={"login": username})
    return result["user"]["id"]


def _get_commits_for_repo(
    repo_full_name: str, author_id: str, since: datetime, until: datetime
):
    owner, name = repo_full_name.split("/")

    variables = {
        "owner": owner,
        "name": name,
        "authorId": author_id,
        "since": since.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "until": until.strftime("%Y-%m-%dT%H:%M:%SZ"),
    }

    try:
        result = CLIENT.execute(GET_ALL_BRANCH_COMMITS_QUERY, variable_values=variables)

        repo_data = result.get("repository")
        if not repo_data or not repo_data.get("refs"):
            return []

        unique_commits = {}
        for branch in repo_data["refs"]["nodes"]:
            history = branch.get("target", {}).get("history", {}).get("nodes", [])
            for commit in history:
                unique_commits[commit["oid"]] = commit

        sorted_commits = sorted(
            unique_commits.values(), key=lambda x: x["committedDate"], reverse=True
        )
        return sorted_commits

    except Exception as e:
        rprint(f"[red]Error fetching {repo_full_name}: {e}[/red]")
        return []


def _commit_color(
    score: float, poor_threshold: float = 0.7, good_threshold: float = 0.3
) -> str:
    return (
        "red"
        if score >= poor_threshold
        else "yellow"
        if score >= good_threshold
        else "green"
    )


def _calc_overall_commit_score(df: pd.DataFrame) -> float:
    if df.empty:
        return 0.0
    scores = df.sort_values("date", ascending=True)["score"].to_numpy()
    weights = np.exp(np.linspace(0, 1, len(scores)))
    weights /= weights.sum()
    return float(np.dot(weights, scores))


def get_user_period_commit_score(
    username: str,
    clf: LogisticRegression,
    scaler: StandardScaler,
    since: datetime,
    until: datetime,
    verbose: bool = True,
) -> float:
    user_id = _get_my_id(username)
    repos = _get_filtered_repos(username, since, until)
    rows = [
        {
            "date": commit["committedDate"][:10],
            "repo": repo_name,
            "message": commit["message"].splitlines()[0],
        }
        for repo_name in repos
        for commit in _get_commits_for_repo(repo_name, user_id, since, until)
    ]

    df = pd.DataFrame(rows).sort_values("date", ascending=False).reset_index(drop=True)
    df["score"] = df["message"].apply(lambda m: score(m, clf, scaler))

    if verbose:
        for _, row in df.iterrows():
            c = _commit_color(row["score"])
            rprint(
                f"[dim]{row['date']}[/dim] [cyan]{row['repo']}[/cyan] [{c}]{row['score']:.4f}[/{c}] {row['message']}"
            )

    overall = _calc_overall_commit_score(df)
    return overall


if __name__ == "__main__":
    artifact = joblib.load(ARTEFACTS_DIR / "regression.pkl")
    clf, scaler = artifact["model"], artifact["scaler"]

    users = [
        "joshua-poole",
        "imareeq",
        "kmyria",
        "jami303",
        "NathanTheDev",
        "hello-andrew-yan",
    ]

    since = datetime.now(UTC) - timedelta(days=100)
    until = datetime.now(UTC)
    days_count = (until - since).days
    rprint(
        f"\n[bold blue]Range:[/bold blue] [dim]{since.strftime('%Y-%m-%d')} "
        f"to {until.strftime('%Y-%m-%d')} ({days_count} days)[/dim]\n"
    )
    for user in users:
        result = get_user_period_commit_score(
            user, clf, scaler, since, until, verbose=False
        )
        c = _commit_color(result)
        rprint(f"[bold]'{user}' Overall Commit Score:[/bold] [{c}]{result:.4f}[/{c}]")
