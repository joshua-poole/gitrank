import { LeaderboardModelSchema } from 'generated/zod/schemas/variants/pure/Leaderboard.pure'
import { UserModelSchema } from 'generated/zod/schemas/variants/pure/User.pure'
import * as z from 'zod'

export const LeaderboardColumnSchema = z.object({
  username: UserModelSchema.shape.username,
  position: z.int(),
  elo: UserModelSchema.shape.elo,
  commits: LeaderboardModelSchema.shape.commits,
})

export type LeaderboardColumn = z.infer<typeof LeaderboardColumnSchema>
