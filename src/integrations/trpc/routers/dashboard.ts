import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '@/integrations/trpc/init'
import { TRPCError } from '@trpc/server'
import { getUserIcon } from '#/server/services/dashboard/getUserIcon'
import { getUserStats } from '#/server/services/dashboard/getUserStats'
import { getContributions } from '#/server/services/dashboard/getContributions'
import { getUserRank } from '#/server/services/dashboard/getUserRank'
import { searchUser } from '#/server/services/dashboard/searchUser'
import { rankUser } from '#/server/services/scoring/rankUser'

export const dashboardRouter = createTRPCRouter({
  searchUser: publicProcedure
    .input(z.object({ username: z.string().min(1) }))
    .query(async ({ input }) => {
      const user = await searchUser(input.username)
      return user
    }),

  getUserStats: publicProcedure
    .input(z.object({ username: z.string().min(1) }))
    .query(async ({ input }) => {
      const stats = await getUserStats(input.username)
      return stats
    }),

  getUserIcon: publicProcedure
    .input(z.object({ username: z.string().min(1) }))
    .query(async ({ input }) => {
      const avatarUrl = await getUserIcon(input.username)
      return avatarUrl
    }),

  getContributions: publicProcedure
    .input(z.object({ username: z.string().min(1) }))
    .query(async ({ input }) => {
      const contributions = await getContributions(input.username)
      return contributions
    }),

  getUserRank: publicProcedure
    .input(z.object({ username: z.string().min(1) }))
    .query(async ({ input }) => {
      return getUserRank(input.username)
    }),

  rankUser: publicProcedure
    .input(z.object({ username: z.string().min(1) }))
    .mutation(async ({ input }) => {
      return rankUser(input.username)
    }),
})
