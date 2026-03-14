import { z } from 'zod'
import { publicProcedure } from '../init'
import { prisma } from '../../../db'
import type { TRPCRouterRecord } from '@trpc/server'

export const challengeRouter = {
  list: publicProcedure.query(() =>
    prisma.challenge.findMany({
      include: { badges: true },
    }),
  ),

  getById: publicProcedure
    .input(z.object({ id: z.bigint() }))
    .query(({ input }) =>
      prisma.challenge.findUnique({
        where: { id: input.id },
        include: { badges: true },
      }),
    ),
} satisfies TRPCRouterRecord

export const badgeRouter = {
  list: publicProcedure.query(() =>
    prisma.badge.findMany({
      include: { challenge: true },
    }),
  ),

  getByUser: publicProcedure
    .input(z.object({ userId: z.bigint() }))
    .query(({ input }) =>
      prisma.userBadges.findMany({
        where: { userId: input.userId },
        include: { badge: { include: { challenge: true } } },
      }),
    ),
} satisfies TRPCRouterRecord
