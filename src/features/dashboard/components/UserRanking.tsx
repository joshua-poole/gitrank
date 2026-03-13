export function UserRanking({ data }: { data?: any }) {
  return (
    <div className="p-4 border rounded">
      <h2>Global Ranking</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}