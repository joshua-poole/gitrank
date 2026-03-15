import { useParams } from '@tanstack/react-router'
import { UserIcon } from './components/UserIcon'
import { UserStats } from './components/UserStats'
import { ContributionGraph } from './components/ContributionGraph'
import { Separator } from '#/components/ui/separator'
import { UserRank } from './components/UserRank'
import { UserTags } from './components/UserTags'

export function DashboardPage() {
  const { username } = useParams({ from: '/dashboard/$username' })
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <UserIcon username={username} size={72} />
        <div>
          <h1 className="text-2xl font-bold text-[var(--sea-ink)]">
            {username}
          </h1>
          <p className="text-sm text-[var(--sea-ink-soft)]">GitHub Profile</p>
        </div>
        <div className="ml-auto">
          <UserRank username={username} />
        </div>
      </div>
      <Separator />
      <UserStats username={username} />
      <Separator />
      <UserTags username={username} />
      <Separator />
      <ContributionGraph username={username} />
    </div>
  )
}
