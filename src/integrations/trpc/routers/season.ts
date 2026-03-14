import { z } from 'zod'
import { publicProcedure } from '../init'
import { prisma } from '../../../db'
import type { TRPCRouterRecord } from '@trpc/server'

export const seasonRouter = {
  list: publicProcedure.query(() =>
    prisma.season.findMany({
      orderBy: { startDate: 'desc' },
    }),
  ),

  getById: publicProcedure
    .input(z.object({ id: z.bigint() }))
    .query(({ input }) =>
      prisma.season.findUnique({
        where: { id: input.id },
        include: {
          leaderboard: {
            orderBy: { position: 'asc' },
            include: { user: true },
          },
        },
      }),
    ),

  getCurrent: publicProcedure.query(() =>
    prisma.season.findFirst({
      where: { endDate: { gte: new Date() } },
      orderBy: { startDate: 'desc' },
    }),
  ),
} satisfies TRPCRouterRecord
