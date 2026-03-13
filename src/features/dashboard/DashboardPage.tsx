// DashboardPage.tsx
import { useQuery } from "@tanstack/react-query"
import { useTRPC } from "#/integrations/trpc/react"
import { UserMetrics } from "./components/UserMetrics"
import { UserRanking } from "./components/UserRanking"

export function DashboardPage() {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.dashboard.getDashboardData.queryOptions({
      userId: 'example-user-id',
    })
  )

  if (isLoading) return <div>Loading...</div>
  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <UserMetrics metrics={data?.stats} />
      <UserRanking data={data} />
    </div>
  )
}
