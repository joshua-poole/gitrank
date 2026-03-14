import type { CommitData, MLSignals, SpikeResult } from './types'
import { getTierFromLevel } from './tiers'

export class MMR {
  private readonly DECAY_PER_DAY = 0.99
  private readonly MAX_AGE_DAYS = 90
  private readonly TZ_OFFSET_MIN = 0

  calculate(commits: CommitData[], signals: MLSignals): SpikeResult {
    const now = new Date()
    const recent = commits
      .filter(
        (c) =>
          (now.getTime() - c.timestamp.getTime()) / 86400000 <=
          this.MAX_AGE_DAYS,
      )
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    const burstiness = this.simpleBurstiness(recent)

    let total = 0
    let weightSum = 0

    for (const c of recent) {
      const ageDays = (now.getTime() - c.timestamp.getTime()) / 86400000
      const w = Math.pow(this.DECAY_PER_DAY, ageDays)

      const spike = this.spike(c, burstiness, signals.stressLevel)

      total += spike * w
      weightSum += w
    }

    // No extra *100 — constants tuned to land in range naturally
    let level = weightSum > 0 ? total / weightSum : 0
    level = Math.min(5000, Math.max(0, Math.round(level)))

    return {
      glucoseLevel: level,
      tier: getTierFromLevel(level),
      breakdown: {
        stressContribution: Math.round(signals.stressLevel * 100),
        lateNightContribution: this.lateNightScore(recent),
        burstContribution: Math.round(burstiness * 100),
        messageQualityDeduction: Math.round(this.avgMsgQuality(recent) * 100),
      },
      recommendation: this.getRecommendation(level, signals),
    }
  }

  private spike(c: CommitData, burst: number, stressSignal: number): number {
    const changes = c.additions + c.deletions
    const msgQ = this.msgQuality(c.message)

    // Base from size (log scale to avoid punishing big refactors too hard)
    let s = Math.log10(changes + 1) * 8

    // Stress modulated by message quality (good msg buffers stress)
    const stressMult = this.lerp(0.85, 1.35, stressSignal * (1 - msgQ))
    s *= stressMult

    // Late night (peaks ~3am) — smaller, but noticeable
    const hour = this.hourLocal(c)
    const isLate = hour >= 23 || hour <= 5
    if (isLate) {
      const factor =
        hour >= 23
          ? this.lerp(0.4, 1.0, (hour - 23) / 5)
          : this.lerp(1.0, 0.6, hour / 5)
      s += 10 * factor
    }

    // Weekend flag — chronic, small
    const day = this.dayLocal(c)
    if (day === 0 || day === 6) s += 8

    // Burstiness — erratic pattern
    s += burst * 15

    return s
  }

  private simpleBurstiness(commits: CommitData[]): number {
    if (commits.length < 3) return 0
    const hours: number[] = []
    for (let i = 1; i < commits.length; i++) {
      const diffH =
        (commits[i].timestamp.getTime() - commits[i - 1].timestamp.getTime()) /
        3600000
      hours.push(Math.max(0, diffH))
    }
    const avg = hours.reduce((a, b) => a + b, 0) / hours.length
    const variance =
      hours.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / hours.length
    const sd = Math.sqrt(variance)
    const cv = avg > 0 ? sd / avg : 0
    return Math.min(1, cv)
  }

  private lateNightScore(commits: CommitData[]): number {
    if (commits.length === 0) return 0
    const late = commits.filter((c) => {
      const h = this.hourLocal(c)
      return h >= 23 || h <= 5
    }).length
    return Math.min(100, (late / commits.length) * 200)
  }

  private avgMsgQuality(commits: CommitData[]): number {
    if (commits.length === 0) return 0
    let t = 0
    for (const c of commits) t += this.msgQuality(c.message)
    return t / commits.length
  }

  private msgQuality(msg: string): number {
    let score = 0.5
    if (msg.length > 50) score += 0.3
    else if (msg.length > 20) score += 0.2
    else if (msg.length > 10) score += 0.1

    if (/^(feat|fix|docs|style|refactor|test|chore)/i.test(msg)) score += 0.2
    if (msg.split(/\s+/).length < 3) score -= 0.2

    return Math.max(0, Math.min(1, score))
  }

  private getRecommendation(level: number, signals: MLSignals): string {
    if (level >= 4000) return ''
    if (level >= 3000) return ''
    if (level >= 2000) return ''
    return ''
  }

  private hourLocal(c: CommitData): number {
    const ms = c.timestamp.getTime() + this.TZ_OFFSET_MIN * 60000
    return new Date(ms).getUTCHours()
  }

  private dayLocal(c: CommitData): number {
    const ms = c.timestamp.getTime() + this.TZ_OFFSET_MIN * 60000
    return new Date(ms).getUTCDay()
  }

  private lerp(a: number, b: number, t: number) {
    const clamped = Math.max(0, Math.min(1, t))
    return a + (b - a) * clamped
  }
}
