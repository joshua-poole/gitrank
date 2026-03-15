import { ContributionGraph } from '#/components/ContributionGraph'
import { Separator } from '#/components/ui/separator'
import { UserIcon } from '#/components/UserIcon'
import { UserRank } from '#/components/UserRank'
import { UserStats } from '#/components/UserStats'
import { createFileRoute, useParams } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/$username')({
  component: DashboardPage,
})

export function DashboardPage() {
  const { username } = useParams({ from: '/dashboard/$username' })
  return (
    <div className="p-20">
      <div className='flex flex-row justify-between items-center w-full'>
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

      {/* <Separator />
      <UserStats username={username} />
      <Separator />
      <ContributionGraph username={username} /> */}
    </div>
  )
}
