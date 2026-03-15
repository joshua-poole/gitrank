import { githubGraphQL } from "#/lib/utils"

export interface DayContributions {
  date: string
  count: number
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
