import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '@/integrations/trpc/init'

export const dashboardRouter = createTRPCRouter({
	getDashboardData: publicProcedure
		.input(z.object({ userId: z.string() }))
		.query(async ({ input }) => {
			const { userId } = input

			return {
				stats: { totalRepos: 12, totalStars: 34 },
				graphs: {
					repoActivity: [
						{ date: '2026-03-01', commits: 3 },
						{ date: '2026-03-02', commits: 5 },
					],
				},
				ml: { rankingPrediction: 0.87 },
			}
		}),
})