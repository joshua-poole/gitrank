from datetime import datetime

import pandas as pd
from gql import GraphQLRequest, gql

from v0_7.core.graphql import GRAPHQL_CLIENT


def _get_author_id(username: str) -> str:
    query = gql("query($username: String!) { user(login: $username) { id } }")
    return GRAPHQL_CLIENT.execute(query, variable_values={"username": username})[
        "user"
    ]["id"]


def _get_contributed_repos_query() -> GraphQLRequest:
    params = "query($username:String!,$since:DateTime!,$until:DateTime!)"
    body = (
        "user(login:$username){contributionsCollection(from:$since,to:$until){"
        "commitContributionsByRepository(maxRepositories:100){"
        "repository{nameWithOwner}}}}"
    )
    return gql(f"{params}{{{body}}}")


def get_contributed_repo_names(
    username: str, since: datetime, until: datetime
) -> list[str]:
    query = _get_contributed_repos_query()
    vars = {
        "username": username,
        "since": since.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "until": until.strftime("%Y-%m-%dT%H:%M:%SZ"),
    }

    result = GRAPHQL_CLIENT.execute(query, variable_values=vars)
    collection = result["user"]["contributionsCollection"][
        "commitContributionsByRepository"
    ]

    return [item["repository"]["nameWithOwner"] for item in collection]


def _get_commit_query() -> GraphQLRequest:
    params = (
        "query($owner:String!,$name:String!,$authorId:ID!,"
        "$since:GitTimestamp!,$until:GitTimestamp!,$cursor:String)"
    )
    body = (
        "repository(owner:$owner,name:$name){defaultBranchRef{target{... on Commit{"
        "history(author:{id:$authorId},since:$since,until:$until,first:100,after:$cursor){"
        "pageInfo{hasNextPage endCursor}nodes{oid message committedDate}}}}}}"
    )
    return gql(f"{params}{{{body}}}")


def _get_user_commits(
    author_id: str, repo_full_name: str, since: datetime, until: datetime
) -> list[dict]:
    owner, name = repo_full_name.split("/")
    query = _get_commit_query()
    variables = {
        "owner": owner,
        "name": name,
        "authorId": author_id,
        "since": since.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "until": until.strftime("%Y-%m-%dT%H:%M:%SZ"),
    }

    all_commits, cursor = [], None
    while True:
        res = GRAPHQL_CLIENT.execute(
            query, variable_values={**variables, "cursor": cursor}
        )
        ref = res["repository"]["defaultBranchRef"]
        if not ref:
            break

        history = ref["target"]["history"]
        all_commits.extend(history["nodes"])

        if not history["pageInfo"]["hasNextPage"]:
            break
        cursor = history["pageInfo"]["endCursor"]

    return all_commits


def get_user_commits(username: str, since: datetime, until: datetime) -> pd.DataFrame:
    repo_names = get_contributed_repo_names(username, since, until)
    author_id = _get_author_id(username)

    results_list = []
    for repo in repo_names:
        commits = _get_user_commits(author_id, repo, since, until)
        if commits:
            results_list.append(
                pd.DataFrame(commits)
                .assign(
                    repo=repo,
                    date=lambda x: pd.to_datetime(x["committedDate"], utc=True),
                )
                .drop(columns=["committedDate"])
            )

    if not results_list:
        return pd.DataFrame()

    return pd.concat(results_list).reset_index(drop=True)
