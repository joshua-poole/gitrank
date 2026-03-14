import os
from collections import defaultdict
from datetime import datetime, timedelta

import joblib
import numpy as np
import requests
from dotenv import load_dotenv
from rich import print as rprint

from .config import ARTEFACTS_DIR
from .run import classify

load_dotenv()

GITHUB_TOKEN = os.environ["GITHUB_TOKEN"]
RESULT_LIMIT = 1000


def get_user_commits_global(username: str, days: int = 21) -> list[tuple[str, str]]:
    date_since = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%SZ")
    query = f"author:{username} author-date:>{date_since}"

    headers = {
        "Accept": "application/vnd.github.cloak-preview+json",
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "User-Agent": "Stress-Detection-App",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    commit_data = []
    page = 1

    while True:
        url = (
            f"https://api.github.com/search/commits?q={query}&per_page=100&page={page}"
        )
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            data = response.json()
            items = data.get("items", [])
            if not items:
                break
            for item in items:
                msg = item["commit"]["message"].split("\n")[0]
                date = item["commit"]["author"]["date"]
                commit_data.append((msg, date))

            if len(commit_data) >= min(data.get("total_count", 0), 1000):
                break
            page += 1
        elif response.status_code == 403:
            print("Rate limit hit.")
            break
        else:
            print(f"Error {response.status_code}: {response.text}")
            break

    return commit_data


def get_repo_commits(repo_path: str, days: int = 21) -> list[tuple[str, str, str]]:
    date_since = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%SZ")

    url = f"https://api.github.com/repos/{repo_path}/commits"
    params = {"since": date_since, "per_page": 100}
    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
    }

    commit_data = []
    response = requests.get(url, headers=headers, params=params)

    if response.status_code == 200:
        commits = response.json()
        for c in commits:
            msg = c["commit"]["message"].split("\n")[0]
            date = c["commit"]["author"]["date"]
            author = c["commit"]["author"]["name"]
            commit_data.append((msg, date, author))
    else:
        rprint(f"[red]Error fetching {repo_path}: {response.status_code}[/red]")

    return commit_data


def compute_stress_score(results: list) -> float:
    if not results:
        return 0.0

    scores = np.array([r.score for r in results])
    n = len(scores)

    weights = np.exp(np.linspace(0, 1, n))
    weights /= weights.sum()

    return float(np.dot(weights, scores))


if __name__ == "__main__":
    artifact = joblib.load(ARTEFACTS_DIR / "20260314_173052.pkl")
    clf = artifact["model"]
    scaler = artifact["scaler"]

    repos = ["NathanTheDev/Hashiwokakero-Solver", "joshua-poole/gitrank"]
    repo_results = defaultdict(list)    

    rprint(
        f"[bold blue]Analyzing stress levels in {len(repos)} repositorie(s)...[/bold blue]"
    )

    for repo in repos:
        try:
            raw_data = get_repo_commits(repo, days=10_000)
            raw_data.sort(key=lambda x: x[1])

            for msg, date, author in raw_data:
                result = classify(msg, clf, scaler)
                result.repo = repo
                result.author = author
                result.timestamp = date
                repo_results[repo].append(result)

        except Exception as e:
            rprint(f"[red]Failed to fetch data for {repo}: {e}[/red]")

    rprint("\n[bold underline]Project Sentiment Report[/bold underline]\n")

    for repo, results in repo_results.items():
        rprint(f"\n[bold reverse] Repository: {repo} [/bold reverse]")

        for result in results:
            rprint(f"({result.author}):", result.render())

        overall = compute_stress_score(results)
        color = "red" if overall > 0.7 else "yellow" if overall > 0.3 else "green"
        bar = "█" * int(overall * 20)
        bar += "·" * (20 - len(bar))

        rprint(
            f"\n[bold]Aggregate Repo Stress Score:[/bold] [{color}]{overall:.4f} {bar}[/{color}]"
        )
