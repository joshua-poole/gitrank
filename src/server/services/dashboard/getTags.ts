interface Tag {
  name: string
  color: 'red' | 'orange' | 'green'
}

interface ScoreResponse {
  commit_score: number
  commit_frequency: number
  commit_consistency: number
}

interface TagsWithScores {
  tags: Tag[]
  scores: ScoreResponse
}

function mapScoresToTags(scores: ScoreResponse): Tag[] {
  const { commit_score, commit_frequency, commit_consistency } = scores

  const qualityTag: Tag = commit_score >= 0.7
    ? { name: 'Clean Commits', color: 'green' }
    : commit_score >= 0.4
    ? { name: 'Lazy Messages', color: 'orange' }
    : { name: 'Terrible Commits', color: 'red' }

  const frequencyTag: Tag = commit_frequency >= 0.7
    ? { name: 'Commit Grinder', color: 'green' }
    : commit_frequency >= 0.4
    ? { name: 'Occasional Pusher', color: 'orange' }
    : { name: 'Ghost Dev', color: 'red' }

  const consistencyTag: Tag = commit_consistency >= 0.7
    ? { name: 'Clockwork Coder', color: 'green' }
    : commit_consistency >= 0.4
    ? { name: 'Sporadic Bursts', color: 'orange' }
    : { name: 'Rage Quitter', color: 'red' }

  return [qualityTag, frequencyTag, consistencyTag]
}

const DEFAULT_SCORES: ScoreResponse = {
  commit_score: 0.5,
  commit_frequency: 0.5,
  commit_consistency: 0.5,
}

export async function getTags(username: string): Promise<TagsWithScores> {
  if (!process.env.ML_SERVICE_URL) {
    return { tags: mapScoresToTags(DEFAULT_SCORES), scores: DEFAULT_SCORES }
  }

  try {
    const toISONoMs = (date: Date) =>
      date.toISOString().replace(/\.\d{3}Z$/, 'Z')

    const since = toISONoMs(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
    const until = toISONoMs(new Date())

    const url = new URL(`${process.env.ML_SERVICE_URL}/commits/score`)
    url.searchParams.set('user', username)
    url.searchParams.set('since', since)
    url.searchParams.set('until', until)

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(15_000),
    })

    if (!response.ok) {
      console.error(`[getTags] ML backend error: ${response.status}`)
      return { tags: mapScoresToTags(DEFAULT_SCORES), scores: DEFAULT_SCORES }
    }

    const scores: ScoreResponse = await response.json()
    return { tags: mapScoresToTags(scores), scores }
  } catch (err) {
    console.error('[getTags] ML service unavailable:', err)
    return { tags: mapScoresToTags(DEFAULT_SCORES), scores: DEFAULT_SCORES }
  }
}
