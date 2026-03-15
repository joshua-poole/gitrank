import type { CommitData } from './types'

const COMMITS_QUERY = `
  query($username: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $username) {
      contributionsCollection(from: $from, to: $to) {
        commitContributionsByRepository(maxRepositories: 100) {
          repository {
            nameWithOwner
            defaultBranchRef {
              target {
                ... on Commit {
                  history(first: 100, author: { id: null }) {
                    nodes {
                      oid
                      message
                      committedDate
                      additions
                      deletions
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`

const AUTHOR_QUERY = `
  query($username: String!) {
    user(login: $username) {
      id
    }
  }
`

const REPO_COMMITS_QUERY = `
  query($owner: String!, $name: String!, $authorId: ID!, $since: GitTimestamp!, $after: String) {
    repository(owner: $owner, name: $name) {
      defaultBranchRef {
        target {
          ... on Commit {
            history(first: 100, author: { id: $authorId }, since: $since, after: $after) {
              pageInfo { hasNextPage endCursor }
              nodes {
                oid
                message
                committedDate
                additions
                deletions
              }
            }
          }
        }
      }
    }
  }
`

function githubHeaders() {
  return {
    'Content-Type': 'application/json',
    'User-Agent': 'github-ranked-app',
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  }
}

async function graphql(query: string, variables: Record<string, unknown>) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: githubHeaders(),
    body: JSON.stringify({ query, variables }),
  })

  if (!res.ok) throw new Error(`GitHub GraphQL error: ${res.status}`)

  const json = await res.json()
  if (json.errors) {
    throw new Error(`GitHub GraphQL error: ${json.errors[0]?.message}`)
  }
  return json.data
}

async function getAuthorId(username: string): Promise<string> {
  const data = await graphql(AUTHOR_QUERY, { username })
  return data.user.id
}

interface RepoInfo {
  owner: string
  name: string
}

async function getContributedRepos(
  username: string,
  from: Date,
  to: Date,
): Promise<RepoInfo[]> {
  const data = await graphql(COMMITS_QUERY, {
    username,
    from: from.toISOString(),
    to: to.toISOString(),
  })

  const repos =
    data?.user?.contributionsCollection?.commitContributionsByRepository ?? []

  return repos.map((r: any) => {
    const [owner, name] = r.repository.nameWithOwner.split('/')
    return { owner, name }
  })
}

async function getRepoCommits(
  repo: RepoInfo,
  authorId: string,
  since: Date,
): Promise<CommitData[]> {
  const commits: CommitData[] = []
  let after: string | null = null

  while (true) {
    const data = await graphql(REPO_COMMITS_QUERY, {
      owner: repo.owner,
      name: repo.name,
      authorId,
      since: since.toISOString(),
      after,
    })

    const history = data?.repository?.defaultBranchRef?.target?.history
    if (!history) break

    for (const node of history.nodes) {
      commits.push({
        hash: node.oid,
        timestamp: new Date(node.committedDate),
        message: node.message,
        additions: node.additions,
        deletions: node.deletions,
        stressLevel: 0,
      })
    }

    if (!history.pageInfo.hasNextPage) break
    after = history.pageInfo.endCursor
  }

  return commits
}

export async function fetchCommits(username: string): Promise<CommitData[]> {
  const to = new Date()
  const from = new Date()
  from.setDate(to.getDate() - 90)

  const [authorId, repos] = await Promise.all([
    getAuthorId(username),
    getContributedRepos(username, from, to),
  ])

  const allCommits: CommitData[] = []
  for (const repo of repos) {
    const commits = await getRepoCommits(repo, authorId, from)
    allCommits.push(...commits)
  }

  return allCommits
}
