import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '#/integrations/trpc/react'
import type { Rank } from '#/server/services/dashboard/getUserRank'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

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
  UNRANKED: '#9ca3af', // gray
  PLASTIC: '#e5e7eb', // light gray
  BRONZE: '#cd7f32', // bronze
  SILVER: '#c0c0c0', // silver
  GOLD: '#ffd700', // gold
  PLATINUM: '#e5e4e2', // platinum
  DIAMOND: '#b9f2ff', // diamond blue
  LINUS: '#f97316', // orange
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
  const elo = 1200

  // return (
  //   <div className="flex items-center gap-3">
  //     <img
  //       src={RANK_IMAGE[rank]}
  //       alt={RANK_LABELS[rank]}
  //       className="w-20 h-20 object-contain"
  //     />
  //     <div className="flex flex-col">
  //       <p className="text-xs text-primary uppercase tracking-wide font-medium">
  //         Rank
  //       </p>
  //       <p className="text-2xl font-bold" style={{ color: RANK_COLORS[rank] }}>
  //         {RANK_LABELS[rank]}
  //       </p>
  //     </div>
  //   </div>
  // )

  return (
    <Card className="w-75">
      <CardContent className="flex flex-row w-full justify-between">
        <div className="flex flex-col">
          <p>{RANK_LABELS[rank]}</p>
          <p>Elo: 1000</p>
        </div>
        <img>
        </img>
      </CardContent>
    </Card>
  )
}
