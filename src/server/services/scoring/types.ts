export interface CommitData {
  hash: string
  timestamp: Date
  message: string
  additions: number
  deletions: number
  commit_score: number // ML message quality
  commit_frequency: number // ML commit frequency
  commit_consistency: number // ML commit consistency
}

export interface Breakdown {
  lateNightContribution: number
  burstContribution: number
  messageQualityDeduction: number
  frequencyContribution: number
  consistencyContribution: number
}

export interface Result {
  eloDelta: number
  breakdown: Breakdown
}
