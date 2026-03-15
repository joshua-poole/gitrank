import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '#/integrations/trpc/react'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { BookMarked, Code2, GitFork, LucideInfo, Star } from 'lucide-react'

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

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  meta?: { label: string; value: string | number }[]
}

function StatCard({ label, value, icon, meta }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-2 min-w-0">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="text-primary">{icon}</div>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {label}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <span className="text-lg font-semibold tracking-tight">{value}</span>
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
    <div className="space-y-4 w-full md:w-1/2">
      {(data.location ||
        data.company ||
        data.website ||
        data.accountCreatedAt) && (
        <Card className="border-[var(--line)]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <LucideInfo className="text-primary" size={18} />
              About
            </CardTitle>
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
                  className="text-(--lagoon-deep) hover:underline"
                >
                  🔗 {data.website}
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
        <StatCard
          label="Public Repos"
          value={data.publicRepos}
          icon={<BookMarked size={18} />}
        />
        <StatCard
          label="Total Commits"
          value={data.totalCommits}
          icon={<Star size={18} />}
        />
        <StatCard
          label="Total PRs"
          value={data.totalPrs}
          icon={<GitFork size={18} />}
        />
        <StatCard
          label="Top Language"
          value={data.topLanguage ?? 'N/A'}
          icon={<Code2 size={18} />}
        />
      </div>
    </div>
  )
}
