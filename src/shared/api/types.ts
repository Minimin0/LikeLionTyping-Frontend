export type Participant = {
  participantId: number
  nickname: string
  isNewParticipant: boolean
  availablePassCount: number
}

export type Category = { id: number; code: string; name: string }
export type Sentence = { sequence: number; content: string }

export type GameStart = {
  gameSessionId: number
  category: Category
  sentences: Sentence[]
}

export type GameStatus = 'IN_PROGRESS' | 'COMPLETED' | 'INVALIDATED'

export type GameResult = {
  gameSessionId: number
  status: GameStatus
  elapsedMs: number | null
  personalBestMs: number | null
  personalBest: boolean
  rank: number | null
}

export type Ranking = { rank: number; nickname: string; elapsedMs: number }

export type AdminLogin = { token: string; expiresAt: string }
export type PlayPass = {
  id: number
  type: 'FREE' | 'PAID'
  status: 'AVAILABLE' | 'CONSUMED' | 'CANCELLED'
  createdAt: string
}
export type AdminSession = {
  id: number
  categoryId: number
  playPassId: number
  status: GameStatus
  elapsedMs: number | null
  startedAt: string
  completedAt: string | null
}
export type AdminParticipant = {
  id: number
  nickname: string
  phone: string
  passes: PlayPass[]
  gameSessions: AdminSession[]
}
export type InvalidateResult = {
  gameSessionId: number
  gameSessionStatus: 'INVALIDATED'
  playPassId: number
  playPassStatus: PlayPass['status']
}
