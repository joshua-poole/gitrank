import { prisma } from '#/db'
import { TRPCError } from '@trpc/server'
import { rankUser } from '#/server/services/scoring/rankUser'

function githubHeaders() {
  return {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'github-ranked-app',
    ...(process.env.GITHUB_TOKEN && {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    }),
  }
}

async function fetchGitHubUser(username: string) {
  const res = await fetch(`https://api.github.com/users/${username}`, {
    headers: githubHeaders(),
  })

  if (res.status === 404) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `GitHub user "${username}" not found`,
    })
  }

  if (res.status === 403 || res.status === 429) {
    const resetHeader = res.headers.get('x-ratelimit-reset')
    const resetAt = resetHeader
      ? new Date(Number(resetHeader) * 1000).toISOString()
      : 'unknown'
    console.error(`GitHub rate limited. Resets at: ${resetAt}`)
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'GitHub API rate limit exceeded. Please try again later.',
    })
  }

  if (!res.ok) {
    const body = await res.text()
    console.error(`GitHub API error: ${res.status} ${res.statusText}`, body)
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `GitHub API error: ${res.status} ${res.statusText}`,
    })
  }

  return res.json()
}

async function fetchGitHubRepos(username: string) {
  const res = await fetch(
    `https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`,
    { headers: githubHeaders() },
  )

  if (!res.ok) {
    console.error(`GitHub repos API error: ${res.status} ${res.statusText}`)
    return []
  }

  return res.json()
}

export async function searchUser(username: string): Promise<{ login: string }> {
  console.log('[searchUser] Looking up username:', username)

  let dbUser
  try {
    dbUser = await prisma.user.findUnique({
      where: { username },
    })
    console.log('[searchUser] DB lookup result:', dbUser)
  } catch (err) {
    console.error('[searchUser] DB lookup failed:', err)
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Database lookup failed',
    })
  }

  if (dbUser) {
    return { login: dbUser.username }
  }

  console.log('[searchUser] User not in DB, fetching from GitHub')
  const ghUser = await fetchGitHubUser(username)
  const repos = await fetchGitHubRepos(username)
  console.log('[searchUser] GitHub data fetched, repos:', repos.length)

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

  try {
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
  } catch (err) {
    console.error('Failed to create user in database:', err)
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to save user data',
    })
  }

  // Score and rank the user in the background (don't block the response)
  rankUser(ghUser.login).catch((err) =>
    console.error(`[searchUser] Failed to rank ${ghUser.login}:`, err),
  )

  return { login: ghUser.login as string }
}
