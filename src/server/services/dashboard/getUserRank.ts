export enum Rank {
  UNRANKED = 'UNRANKED',
  PLASTIC = 'PLASTIC',
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  DIAMOND = 'DIAMOND',
  LINUS = 'LINUS',
}

export interface UserRank {
  rank: Rank
}

export async function getUserRank(username: string): Promise<UserRank> {
  return { rank: Rank.GOLD }
}
