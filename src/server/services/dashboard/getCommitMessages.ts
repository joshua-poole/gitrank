import { githubGraphQL } from "#/lib/utils"

const COMMIT_MESSAGES_QUERY = `
  query($username: String!, $since: DateTime!) {
    user(login: $username) {
      contributionsCollection(from: $since) {
        commitContributionsByRepository(maxRepositories: 20) {
          repository {
            defaultBranchRef {
              target {
                ... on Commit {
                  history(first: 100) {
                    nodes {
                      message
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

export async function getCommitMessages(username: string): Promise<string[]> {
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  const data = await githubGraphQL<any>(COMMIT_MESSAGES_QUERY, {
    username,
    since,
  })

  return (
    data?.user?.contributionsCollection?.commitContributionsByRepository?.flatMap(
      (c: any) =>
        c.repository.defaultBranchRef?.target?.history?.nodes?.map(
          (n: any) => n.message,
        ) ?? [],
    ) ?? []
  )
}
