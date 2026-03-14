import { prisma } from '#/db'
import { TRPCError } from '@trpc/server'

export async function searchUser(username: string): Promise<{ login: string }> {
  const dbUser = await prisma.user.findUnique({
    where: { username: username },
  })

  if (!dbUser) {
    const res = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'github-ranked-app',
        ...(process.env.GITHUB_TOKEN && {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        }),
      },
    })

    if (res.status === 404) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `GitHub user "${username}" not found`,
      })
    }

    if (!res.ok) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'GitHub API error',
      })
    }

    const ghUser = await res.json()

    const reposRes = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'github-ranked-app',
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          }),
        },
      },
    )
    const repos = reposRes.ok ? await reposRes.json() : []

    const totalStars = repos.reduce(
      (sum: number, r: any) => sum + r.stargazers_count,
      0,
    )
    const totalForks = repos.reduce(
      (sum: number, r: any) => sum + r.forks_count,
      0,
    )
    const languageCounts = repos.reduce(
      (acc: Record<string, number>, r: any) => {
        if (r.language) acc[r.language] = (acc[r.language] ?? 0) + 1
        return acc
      },
      {},
    )
    const topLanguage =
      (Object.entries(languageCounts) as [string, number][]).sort(
        (a, b) => b[1] - a[1],
      )[0]?.[0] ?? null

    await prisma.user.create({
      data: {
        username: ghUser.login,
        rank: 'UNRANKED',
        elo: 0,
        placementCompleted: false,
        publicRepos: ghUser.public_repos ?? 0,
        totalStars,
        totalForks,
        topLanguage,
        location: ghUser.location ?? null,
        company: ghUser.company ?? null,
        website: ghUser.blog ?? null,
        accountCreatedAt: new Date(ghUser.created_at),
      },
    })

    return { login: ghUser.login as string }
  }

  return { login: dbUser.username }
}
