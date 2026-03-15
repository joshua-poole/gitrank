import type { Breakdown, CommitData, Result } from './types'

const DECAY_PER_DAY = 0.99
const MAX_AGE_DAYS = 90
const TZ_OFFSET_MIN = 0

const WEIGHTS = {
  loc: 0.25,
  time: 0.1,
  day: 0.05,
  message: 0.2,
  consistency: 0.15,
  frequency: 0.25,
}

function locScore(c: CommitData): number {
  const changes = c.additions + c.deletions
  return Math.min(1.0, Math.log10(changes + 1) / 4)
}

function hourLocal(c: CommitData): number {
  const adjusted = new Date(c.timestamp.getTime() + TZ_OFFSET_MIN * 60_000)
  return adjusted.getUTCHours()
}

function dayLocal(c: CommitData): number {
  const adjusted = new Date(c.timestamp.getTime() + TZ_OFFSET_MIN * 60_000)
  return adjusted.getUTCDay() // 0 = Sunday
}

function timeScore(c: CommitData): number {
  const hour = hourLocal(c)
  if (hour >= 9 && hour <= 17) return 1.0
  if ((hour >= 6 && hour <= 8) || (hour >= 18 && hour <= 22)) return 0.5
  return 0.0
}

function dayScore(c: CommitData): number {
  const day = dayLocal(c)
  return day === 0 || day === 6 ? 0.3 : 1.0
}

function simpleBurstiness(commits: CommitData[]): number {
  if (commits.length < 3) return 0.0

  const hours: number[] = []
  for (let i = 1; i < commits.length; i++) {
    const diffH =
      (commits[i].timestamp.getTime() - commits[i - 1].timestamp.getTime()) /
      3_600_000
    hours.push(Math.max(0.0, Math.min(48.0, diffH)))
  }

  const avg = hours.reduce((s, h) => s + h, 0) / hours.length
  const variance =
    hours.reduce((s, h) => s + (h - avg) ** 2, 0) / hours.length
  const sd = Math.sqrt(variance)
  const cv = avg > 0 ? sd / avg : 0

  return Math.min(1.0, cv / 2)
}

export function calculateElo(commits: CommitData[]): Result {
  const now = new Date()

  const recent = commits
    .filter((c) => {
      const ageDays =
        (now.getTime() - c.timestamp.getTime()) / 86_400_000
      return ageDays <= MAX_AGE_DAYS
    })
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

  if (recent.length === 0) {
    return {
      eloDelta: 0,
      breakdown: {
        lateNightContribution: 0,
        burstContribution: 0,
        messageQualityDeduction: 0,
        frequencyContribution: 0,
        consistencyContribution: 0,
      },
    }
  }

  const burstiness = simpleBurstiness(recent)

  let total = 0.0
  let avgTimeScore = 0.0
  let totalMsgScore = 0.0
  let totalFrequency = 0.0
  let totalCombinedConsistency = 0.0

  for (const c of recent) {
    const ageDays =
      (now.getTime() - c.timestamp.getTime()) / 86_400_000
    const w = Math.pow(DECAY_PER_DAY, ageDays)

    const ls = locScore(c)
    const ts = timeScore(c)
    const ds = dayScore(c)

    const msgScore = c.commit_score ?? 0.5
    const frequency = c.commit_frequency ?? 0.0
    const mlConsistency = c.commit_consistency ?? 0.5

    avgTimeScore += ts
    totalMsgScore += msgScore
    totalFrequency += frequency

    const combinedConsistency = (mlConsistency + (1.0 - burstiness)) / 2
    totalCombinedConsistency += combinedConsistency

    const combined =
      WEIGHTS.loc * ls +
      WEIGHTS.time * ts +
      WEIGHTS.day * ds +
      WEIGHTS.message * msgScore +
      WEIGHTS.consistency * combinedConsistency +
      WEIGHTS.frequency * frequency

    const spike = combined * 30
    total += spike * w
  }

  const commitCount = recent.length
  avgTimeScore /= commitCount
  const avgMsgScore = totalMsgScore / commitCount
  const avgFrequency = totalFrequency / commitCount
  const avgCombinedConsistency = totalCombinedConsistency / commitCount

  const level = Math.round(total)

  const breakdown: Breakdown = {
    lateNightContribution: Math.round((1 - avgTimeScore) * 100),
    burstContribution: Math.round(burstiness * 100),
    messageQualityDeduction: Math.round((1 - avgMsgScore) * 100),
    frequencyContribution: Math.round(avgFrequency * 100),
    consistencyContribution: Math.round(avgCombinedConsistency * 100),
  }

  return { eloDelta: level, breakdown }
}
