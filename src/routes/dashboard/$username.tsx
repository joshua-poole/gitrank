import { CommitCloud } from '#/components/CommitCloud'
import { ContributionGraph } from '#/components/ContributionGraph'
import { Separator } from '#/components/ui/separator'
import { UserIcon } from '#/components/UserIcon'
import { UserRank } from '#/components/UserRank'
import { UserStats } from '#/components/UserStats'
import { UserTags } from '#/components/UserTags'
import { createFileRoute, useParams } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/$username')({
  component: DashboardPage,
})

export function DashboardPage() {
  const { username } = useParams({ from: '/dashboard/$username' })
  return (
    <div className="p-10 sm:p-20">
      <div className="flex flex-col justify-center gap-4 sm:flex-row sm:justify-between items-center w-full">
        <div className="flex items-center gap-4">
          <UserIcon username={username} size={72} />
          <div>
            <h1 className="text-2xl font-bold">{username}</h1>
            <a
              href={`https://github.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm"
            >
              GitHub Profile
            </a>
          </div>
        </div>
        <UserRank username={username} />
      </div>

      <Separator />
      <div className="flex flex-col md:flex-row gap-2.5 pt-5">
        <UserStats username={username} />
        <ContributionGraph username={username} />
      </div>
      <div className="flex flex-col md:flex-row gap-2.5 pt-5">
        <UserTags username={username} />
        <CommitCloud username={username} />
      </div>
    </div>
  )
}
