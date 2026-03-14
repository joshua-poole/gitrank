import { prisma } from '#/db'
import { TRPCError } from '@trpc/server'

export interface UserStats {
  publicRepos: number
  totalStars: number
  totalForks: number
  topLanguage: string | null
  location: string | null
  company: string | null
  website: string | null
  accountCreatedAt: string
}

export async function getUserStats(username: string): Promise<UserStats> {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      publicRepos: true,
      totalStars: true,
      totalForks: true,
      topLanguage: true,
      location: true,
      company: true,
      website: true,
      accountCreatedAt: true,
    },
  })

  if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: `User "${username}" not found` })

  return {
    publicRepos: user.publicRepos,
    totalStars: user.totalStars,
    totalForks: user.totalForks,
    topLanguage: user.topLanguage,
    location: user.location,
    company: user.company,
    website: user.website,
    accountCreatedAt: user.accountCreatedAt?.toISOString() ?? '',
  }
}
