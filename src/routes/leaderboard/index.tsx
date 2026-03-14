import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/leaderboard/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <main className="flex flex-col page-wrap px-4 pb-8 pt-14 gap-10 justify-center items-center">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold">Global Leaderboard</h1>
      </div>
    </main>
  )
}
