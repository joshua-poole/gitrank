import { prisma } from '#/db'
import { Rank } from '#/server/services/dashboard/getUserRank'
import { calculateElo } from './elo'
import { fetchCommits } from './fetchCommits'
import { applyMLScores, scoreCommitsML } from './scoreCommits'

const RANK_THRESHOLDS: { max: number; rank: Rank }[] = [
  { max: 500, rank: Rank.PLASTIC },
  { max: 1200, rank: Rank.BRONZE },
  { max: 2000, rank: Rank.SILVER },
  { max: 3000, rank: Rank.GOLD },
  { max: 3800, rank: Rank.PLATINUM },
  { max: 4500, rank: Rank.DIAMOND },
  { max: 5000, rank: Rank.LINUS },
]

function eloToRank(elo: number): Rank {
  if (elo <= 0) return Rank.UNRANKED
  for (const { max, rank } of RANK_THRESHOLDS) {
    if (elo <= max) return rank
  }
  return Rank.LINUS
}

export async function rankUser(
  username: string,
): Promise<{ elo: number; rank: Rank }> {
  const commits = await fetchCommits(username)

  if (commits.length === 0) {
    return { elo: 0, rank: Rank.UNRANKED }
  }

  const mlResult = await scoreCommitsML(username)
  const scoredCommits = applyMLScores(commits, mlResult)
  const result = calculateElo(scoredCommits)

  const elo = result.eloDelta
  const rank = eloToRank(elo)

  await prisma.user.update({
    where: { username },
    data: { elo, rank },
  })

  return { elo, rank }
}
