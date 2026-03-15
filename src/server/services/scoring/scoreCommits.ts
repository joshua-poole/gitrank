import type { CommitData } from './types'

const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? 'http://localhost:8000'

interface PerformanceVector {
  commit_score: number
  commit_frequency: number
  commit_consistency: number
}

export async function scoreCommitsML(
  username: string,
): Promise<PerformanceVector | null> {
  const to = new Date()
  const from = new Date()
  from.setDate(to.getDate() - 180)

  try {
    const url = new URL('/commits/score', ML_SERVICE_URL)
    url.searchParams.set('user', username)
    url.searchParams.set('since', from.toISOString())
    url.searchParams.set('until', to.toISOString())

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) {
      console.error(`[scoreCommitsML] ML service error: ${res.status}`)
      return null
    }

    return await res.json()
  } catch (err) {
    console.error('[scoreCommitsML] ML service unavailable:', err)
    return null
  }
}

export function applyMLScores(
  commits: CommitData[],
  ml: PerformanceVector | null,
): CommitData[] {
  const score = ml?.commit_score ?? 0.5
  const frequency = ml?.commit_frequency ?? 0.0
  const consistency = ml?.commit_consistency ?? 0.5

  return commits.map((c) => ({
    ...c,
    commit_score: score,
    commit_frequency: frequency,
    commit_consistency: consistency,
  }))
}
