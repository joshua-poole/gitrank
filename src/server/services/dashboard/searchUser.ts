import { TRPCError } from '@trpc/server'

export async function searchUser(username: String): Promise<{ login: string }> {
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

  const user = await res.json()
  return { login: user.login as string }
}
