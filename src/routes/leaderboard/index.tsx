import { LeaderboardTable } from '#/components/LeaderboardTable'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/leaderboard/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <main className="flex flex-col w-full page-wrap px-4 pb-8 pt-14 gap-10 justify-center items-center">
      <div className="flex flex-col w-full items-center justify-center">
        <h1 className="text-4xl font-bold">Global Leaderboard</h1>
        {/* TODO: Add distribution chart */}
      </div>
      <LeaderboardTable />
    </main>
  )
}
