import { z } from 'zod'
import { publicProcedure } from '../init'
import { prisma } from '../../../db'
import type { TRPCRouterRecord } from '@trpc/server'
import { getUserIcon } from '#/server/services/dashboard/getUserIcon'
import { getUserRank } from '#/server/services/dashboard/getUserRank'
import { getExtraStats } from '#/server/services/dashboard/getContributions'
export const userRouter = {
  getByUsername: publicProcedure
    .input(z.object({ username: z.string().min(1) }))
    .query(({ input }) =>
      prisma.user.findUnique({
        where: { username: input.username },
        include: { badges: { include: { badge: true } } },
      }),
    ),

  getById: publicProcedure
    .input(z.object({ id: z.bigint() }))
    .query(({ input }) =>
      prisma.user.findUnique({
        where: { id: input.id },
        include: { badges: { include: { badge: true } } },
      }),
    ),

  topByElo: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(10) }))
    .query(({ input }) =>
      prisma.user.findMany({
        orderBy: { elo: 'desc' },
        take: input.limit,
      }),
    ),

    // in userRouter
  
  
  compareUsers: publicProcedure
  .input(z.object({ username1: z.string().min(1), username2: z.string().min(1) }))
  .query(async ({ input }) => {
    const [extra1, extra2, icon1, icon2,] = await Promise.all([
      getExtraStats(input.username1),
      getExtraStats(input.username2),
      getUserIcon(input.username1),
      getUserIcon(input.username2),
    ])

    return {
      user1: { username: input.username1, icon: icon1, ...extra1 },
      user2: { username: input.username2, icon: icon2,  ...extra2 },
    }
  })
} satisfies TRPCRouterRecord
