import { prisma } from '#/db'
import { TRPCError } from '@trpc/server'

export enum Rank {
  UNRANKED = 'UNRANKED',
  PLASTIC = 'PLASTIC',
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  DIAMOND = 'DIAMOND',
  LINUS = 'LINUS',
}

export interface UserRank {
  rank: Rank
  elo: number
}

export async function getUserRank(username: string): Promise<UserRank> {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { rank: true, elo: true },
  })

  if (!user) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `User "${username}" not found`,
    })
  }

  return { rank: user.rank as Rank, elo: Number(user.elo) }
}

