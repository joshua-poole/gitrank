import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '#/integrations/trpc/react'
import type { Rank } from '#/server/services/dashboard/getUserRank'
import { Card, CardContent } from './ui/card'

interface UserRankProps {
  username: string
}

const RANK_IMAGE: Record<string, string> = {
  UNRANKED: '/ranks/unranked.png',
  PLASTIC_I: '/ranks/plastic_i.png',
  PLASTIC_II: '/ranks/plastic_ii.png',
  PLASTIC_III: '/ranks/plastic_iii.png',
  BRONZE_I: '/ranks/bronze_i.png',
  BRONZE_II: '/ranks/bronze_ii.png',
  BRONZE_III: '/ranks/bronze_iii.png',
  SILVER_I: '/ranks/silver_i.png',
  SILVER_II: '/ranks/silver_ii.png',
  SILVER_III: '/ranks/silver_iii.png',
  GOLD_I: '/ranks/gold_i.png',
  GOLD_II: '/ranks/gold_ii.png',
  GOLD_III: '/ranks/gold_iii.png',
  PLATINUM_I: '/ranks/platinum_i.png',
  PLATINUM_II: '/ranks/platinum_ii.png',
  PLATINUM_III: '/ranks/platinum_iii.png',
  DIAMOND_I: '/ranks/diamond_i.png',
  DIAMOND_II: '/ranks/diamond_ii.png',
  DIAMOND_III: '/ranks/diamond_iii.png',
  LINUS: '/ranks/linus.png',
}

const RANK_COLORS: Record<Rank, string> = {
  UNRANKED: '#9ca3af',
  PLASTIC: '#e5e7eb',
  BRONZE: '#cd7f32',
  SILVER: '#c0c0c0',
  GOLD: '#ffd700',
  PLATINUM: '#e5e4e2',
  DIAMOND: '#b9f2ff',
  LINUS: '#f97316',
}

// Ordered rank tiers, each spanning 1000 elo (0–999, 1000–1999, etc.)
const RANK_TIERS = [
  'PLASTIC',
  'BRONZE',
  'SILVER',
  'GOLD',
  'PLATINUM',
  'DIAMOND',
  'LINUS',
]

const SUBRANK_SUFFIXES = ['_III', '_II', '_I'] as const

/**
 * Maps an elo value to:
 *   - imageKey: key into RANK_IMAGE (e.g. "GOLD_II")
 *   - label:    display label       (e.g. "Gold II")
 *   - rank:     the base rank tier  (e.g. "GOLD")
 *
 * Elo layout:
 *   0–999    → PLASTIC  (0–332 = III, 333–665 = II, 666–999 = I)
 *   1000–1999 → BRONZE
 *   ...
 *   5000–5999 → DIAMOND
 *   6000–6999 → LINUS   (no subranks)
 */
function eloToRankInfo(elo: number): {
  imageKey: string
  label: string
  rank: Rank
} {
  const tierIndex = Math.min(Math.floor(elo / 1000), RANK_TIERS.length - 1)
  const rank = RANK_TIERS[tierIndex] as Rank

  // LINUS has no subranks
  if (rank === 'LINUS') {
    return { imageKey: 'LINUS', label: 'Linus', rank }
  }

  const eloWithinTier = elo % 1000
  // 0–332 = subrank index 0 (III), 333–665 = 1 (II), 666–999 = 2 (I)
  const subIndex = Math.min(Math.floor(eloWithinTier / 333), 2)
  const suffix = SUBRANK_SUFFIXES[subIndex] // '_III' | '_II' | '_I'
  const imageKey = `${rank}${suffix}`

  const subLabel = suffix.replace('_', '') // 'III' | 'II' | 'I'
  const tierLabel = rank.charAt(0) + rank.slice(1).toLowerCase()
  const label = `${tierLabel} ${subLabel}`

  return { imageKey, label, rank }
}

export function UserRank({ username }: UserRankProps) {
  const trpc = useTRPC()
  const { data, isLoading, isError } = useQuery(
    trpc.dashboard.getUserRank.queryOptions({ username }),
  )

  if (isLoading)
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="w-20 h-20 rounded-full bg-(--line) animate-pulse" />
        <div className="h-4 w-16 rounded bg-(--line) animate-pulse" />
      </div>
    )

  if (isError) return null
  if (!data) return null

  const rank = data.rank as Rank
  const elo = data.elo

  const isUnranked = rank === 'UNRANKED'
  const { imageKey, label } = isUnranked
    ? { imageKey: 'UNRANKED', label: 'Unranked' }
    : eloToRankInfo(elo)

  return (
    <Card className="w-full sm:w-75">
      <CardContent className="flex flex-row w-full justify-between items-center">
        <div className="flex flex-col">
          <p className="text-xs text-primary uppercase tracking-wide font-medium">
            Rank
          </p>
          <p
            className="text-2xl font-bold"
            style={{ color: RANK_COLORS[rank] }}
          >
            {label}
          </p>
          <p className="text-sm text-muted-foreground">
            {label === 'Unranked'
              ? 'You need 10 commits to get ranked'
              : `Elo: ${elo}`}
          </p>
        </div>
        <img
          src={RANK_IMAGE[imageKey]}
          alt={label}
          className="w-20 h-20 object-contain"
        />
      </CardContent>
    </Card>
  )
}
