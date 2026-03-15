import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '#/integrations/trpc/react'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'

interface UserStatsProps {
  username: string
}

export interface UserStats {
  followers: number
  following: number
  publicRepos: number
  accountCreatedAt: string
  bio: string | null
  location: string | null
  company: string | null
  website: string | null
  totalStars: number
  totalForks: number
  topLanguage: string | null
  mostStarredRepo: { name: string; stars: number } | null
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="border-(--line)">
      <CardHeader className="pb-1 pt-3 px-4">
        <CardTitle className="text-xs font-medium uppercase tracking-wide">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <span className="text-xl font-bold">{value}</span>
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
        <StatCard label="Total Stars" value={data.totalStars} />
        <StatCard label="Total Forks" value={data.totalForks} />
        <StatCard label="Top Language" value={data.topLanguage ?? 'N/A'} />
      </div>

      {(data.location || data.company || data.website) && (
        <Card className="border-[var(--line)]]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">About</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              {data.accountCreatedAt && (
                <p>
                  🗓️ Member Since{' '}
                  {new Date(data.accountCreatedAt).getFullYear()}
                </p>
              )}
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
