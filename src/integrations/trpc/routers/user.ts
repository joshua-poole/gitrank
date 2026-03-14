import { z } from 'zod'
import { publicProcedure } from '../init'
import { prisma } from '../../../db'
import type { TRPCRouterRecord } from '@trpc/server'

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
} satisfies TRPCRouterRecord
