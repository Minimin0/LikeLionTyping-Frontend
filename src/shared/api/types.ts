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
  resumedExisting: boolean
  passConsumed: boolean
  availablePassCount: number
}

export type ParticipantPlayState = {
  availablePassCount: number
  activeGame: { gameSessionId: number; categoryId: number } | null
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
export type AdminPayment = {
  id: number
  quantity: number
  amountKrw: number
  createdAt: string
}
export type AdminPaymentHistoryItem = AdminPayment & {
  participantId: number
  nickname: string
  phone: string
}
export type AdminPaymentHistory = {
  totalPaymentAmountKrw: number
  totalPaymentCount: number
  totalPaidPassQuantity: number
  payments: AdminPaymentHistoryItem[]
}
export type AdminSession = {
  id: number
  categoryId: number
  playPassId: number
  status: GameStatus
  elapsedMs: number | null
  startedAt: string
  completedAt: string | null
  invalidationReason: string | null
}
export type AdminCategoryBest = { categoryCode: string; elapsedMs: number | null }
export type AdminParticipantSummary = {
  freeParticipationUsed: boolean
  availablePassCount: number
  availablePaidPassCount: number
  totalPlayCount: number
  completedGameCount: number
  invalidatedGameCount: number
  totalPaymentAmountKrw: number
  bestRecords: AdminCategoryBest[]
}
export type AdminParticipant = {
  id: number
  nickname: string
  phone: string
  passes: PlayPass[]
  gameSessions: AdminSession[]
  payments: AdminPayment[]
  summary: AdminParticipantSummary
}
export type AdminParticipantSearchResult = AdminParticipant
export type AdminDashboard = {
  totalParticipants: number
  totalPlayCount: number
  freePlayCount: number
  paidPlayCount: number
  totalPaymentAmountKrw: number
  availablePaidPassCount: number
  ch01PlayCount: number
  ch02PlayCount: number
  ch03PlayCount: number
  completedGameCount: number
  invalidatedGameCount: number
}
export type IssuePassResult = {
  quantity: number
  amountKrw: number
  availablePaidPassCount: number
  payment: AdminPayment
  passes: PlayPass[]
}
export type InvalidateResult = {
  gameSessionId: number
  gameSessionStatus: 'INVALIDATED'
  playPassId: number
  playPassStatus: PlayPass['status']
}
