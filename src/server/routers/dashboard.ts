import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '@/integrations/trpc/init'
import { TRPCError } from '@trpc/server'

export const dashboardRouter = createTRPCRouter({
	searchUser: publicProcedure
		.input(z.object({ username: z.string().min(1) }))
		.query(async ({ input }) => {
			const res = await fetch(`https://api.github.com/users/${input.username}`, {
				headers: {
					Accept: 'application/vnd.github+json',
					...(process.env.GITHUB_TOKEN && {
						Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
					}),
				},
			})

			if (res.status === 404) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: `GitHub user "${input.username}" not found`,
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
		}),

	getDashboardData: publicProcedure
		.input(z.object({ username: z.string() }))
		.query(async ({ input }) => {
			const { username } = input

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