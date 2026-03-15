interface Tag {
  name: string
  color: 'red' | 'orange' | 'green'
}

export async function getTags(username: string): Promise<Tag[]> {
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days

  const url = new URL(`${process.env.ML_BACKEND_URL}/commits/score/`)
  url.searchParams.set('username', username)
  url.searchParams.set('since', since)

  const response = await fetch(url.toString())

  if (!response.ok) {
    throw new Error(`ML backend error: ${response.status}`)
  }

  return response.json()
}