type Metrics = {
  totalRepos: number
  totalStars: number
}

export function UserMetrics({ metrics }: { metrics?: Metrics }) {
  if (!metrics) return null
  return (
    <div className="flex gap-4">
      <div className="p-4 border rounded">Repos: {metrics.totalRepos}</div>
      <div className="p-4 border rounded">Stars: {metrics.totalStars}</div>
    </div>
  )
}
