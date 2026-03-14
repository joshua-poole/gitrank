import { z } from 'zod'
import { publicProcedure } from '../init'
import { prisma } from '../../../db'
import type { TRPCRouterRecord } from '@trpc/server'

export const leaderboardRouter = {
  getBySeason: publicProcedure
    .input(z.object({ seasonId: z.bigint() }))
    .query(({ input }) =>
      prisma.leaderboard.findMany({
        where: { seasonId: input.seasonId },
        orderBy: { position: 'asc' },
        include: { user: true },
      }),
    ),

  getUserPosition: publicProcedure
    .input(z.object({ userId: z.bigint(), seasonId: z.bigint() }))
    .query(({ input }) =>
      prisma.leaderboard.findUnique({
        where: {
          userId_seasonId: {
            userId: input.userId,
            seasonId: input.seasonId,
          },
        },
        include: { user: true, season: true },
      }),
    ),
} satisfies TRPCRouterRecord
