import { createTRPCRouter } from './init'
import { userRouter } from './routers/user'
import { leaderboardRouter } from './routers/leaderboard'
import { seasonRouter } from './routers/season'
import { challengeRouter, badgeRouter } from './routers/challenge'

export const trpcRouter = createTRPCRouter({
  user: userRouter,
  leaderboard: leaderboardRouter,
  season: seasonRouter,
  challenge: challengeRouter,
  badge: badgeRouter,
})
export type TRPCRouter = typeof trpcRouter
