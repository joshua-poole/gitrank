import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '#/integrations/trpc/react'
import { Card, CardContent } from '#/components/ui/card'
import type { Rank } from '#/server/services/dashboard/getUserRank'

interface UserRankProps {
  username: string
}

const RANK_LABELS: Record<Rank, string> = {
  UNRANKED: 'Unranked',
  PLASTIC: 'Plastic',
  BRONZE: 'Bronze',
  SILVER: 'Silver',
  GOLD: 'Gold',
  PLATINUM: 'Platinum',
  DIAMOND: 'Diamond',
  LINUS: 'Linus',
}

const RANK_IMAGE: Record<Rank, string> = {
  UNRANKED: '/ranks/unranked.png',
  PLASTIC: '/ranks/plastic.png',
  BRONZE: '/ranks/bronze.png',
  SILVER: '/ranks/silver.png',
  GOLD: '/ranks/gold.png',
  PLATINUM: '/ranks/platinum.png',
  DIAMOND: '/ranks/diamond.png',
  LINUS: '/ranks/linus.png',
}

export function UserRank({ username }: UserRankProps) {
  const trpc = useTRPC()
  const { data, isLoading, isError } = useQuery(
    trpc.dashboard.getUserRank.queryOptions({ username }),
  )

  if (isLoading)
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="w-20 h-20 rounded-full bg-[var(--line)] animate-pulse" />
        <div className="h-4 w-16 rounded bg-[var(--line)] animate-pulse" />
      </div>
    )

  if (isError) return null
  if (!data) return null

  const rank = data.rank as Rank

  return (
    <div className="flex items-center gap-3">
      <img
        src={RANK_IMAGE[rank]}
        alt={RANK_LABELS[rank]}
        className="w-20 h-20 object-contain"
      />
      <div className="flex flex-col">
        <p className="text-xs text-[var(--sea-ink-soft)] uppercase tracking-wide font-medium">
          Rank
        </p>
        <p className="text-2xl font-bold text-[var(--sea-ink)]">
          {RANK_LABELS[rank]}
        </p>
      </div>
    </div>
  )
}
