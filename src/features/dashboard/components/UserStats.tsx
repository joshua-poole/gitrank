import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '#/integrations/trpc/react'
import type { UserStats } from '../types'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'

interface UserStatsProps {
  username: string
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="border-[var(--line)] bg-[var(--surface)]">
      <CardHeader className="pb-1 pt-3 px-4">
        <CardTitle className="text-xs text-[var(--sea-ink-soft)] font-medium uppercase tracking-wide">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <span className="text-xl font-bold text-[var(--sea-ink)]">{value}</span>
      </CardContent>
    </Card>
  )
}

export function UserStats({ username }: UserStatsProps) {
  const trpc = useTRPC()
  const { data, isLoading, isError } = useQuery(
    trpc.dashboard.getUserStats.queryOptions({ username }),
  )

  if (isLoading) return <div>Loading stats...</div>
  if (isError) return <div>Failed to load stats.</div>
  if (!data) return null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Public Repos" value={data.publicRepos} />
        <StatCard label="Followers" value={data.followers} />
        <StatCard label="Following" value={data.following} />
        <StatCard label="Total Stars" value={data.totalStars} />
        <StatCard label="Total Forks" value={data.totalForks} />
        <StatCard label="Top Language" value={data.topLanguage ?? 'N/A'} />
        <StatCard
          label="Member Since"
          value={new Date(data.accountCreatedAt).getFullYear()}
        />
        {data.mostStarredRepo && (
          <StatCard
            label="Most Starred"
            value={`${data.mostStarredRepo.name} (${data.mostStarredRepo.stars}⭐)`}
          />
        )}
      </div>

      {(data.bio || data.location || data.company || data.website) && (
        <Card className="border-[var(--line)] bg-[var(--surface)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[var(--sea-ink-soft)]">
              About
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-[var(--sea-ink)]">
            {data.bio && <p>{data.bio}</p>}
            {data.location && <p>📍 {data.location}</p>}
            {data.company && <p>🏢 {data.company}</p>}
            {data.website && (
              <a
                href={data.website}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--lagoon-deep)] hover:underline"
              >
                🔗 {data.website}
              </a>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
