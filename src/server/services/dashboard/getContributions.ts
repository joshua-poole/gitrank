import { githubGraphQL } from "#/lib/utils"

export interface DayContributions {
  date: string
  count: number
}

export interface ExtraStats {
  followers: number
  commits: number
  publicRepos: number
  totalStars: number
}

const CONTRIBUTIONS_QUERY = `
  query($username: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $username) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`

export async function getContributions(username: string): Promise<DayContributions[]> {
  const to = new Date()
  const from = new Date()
  from.setDate(to.getDate() - 90)

  const data = await githubGraphQL<any>(CONTRIBUTIONS_QUERY, {
    username,
    from: from.toISOString(),
    to: to.toISOString(),
  })

  const weeks = data?.user?.contributionsCollection?.contributionCalendar?.weeks ?? []
  return weeks.flatMap((week: any) =>
    week.contributionDays.map((day: any) => ({
      date: day.date,
      count: day.contributionCount,
    })),
  )
}

export async function getExtraStats(username: string): Promise<ExtraStats> {
  const [profile, repos, commits] = await Promise.all([
    fetch(`https://api.github.com/users/${username}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'github-ranked-app',
        ...(process.env.GITHUB_TOKEN && {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        }),
      },
    }).then(r => r.json()),
    fetch(`https://api.github.com/users/${username}/repos?per_page=100`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'github-ranked-app',
        ...(process.env.GITHUB_TOKEN && {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        }),
      },
    }).then(r => r.json()),
    fetch(`https://api.github.com/search/commits?q=author:${username}`, {
      headers: {
        Accept: 'application/vnd.github.cloak-preview+json',
        'User-Agent': 'github-ranked-app',
        ...(process.env.GITHUB_TOKEN && {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        }),
      },
    }).then(r => r.json()),
  ])

  return {
    followers: profile.followers as number,
    commits: commits.total_count as number,
    publicRepos: profile.public_repos as number,
    totalStars: repos.reduce((sum: number, r: any) => sum + r.stargazers_count, 0),
  }
}