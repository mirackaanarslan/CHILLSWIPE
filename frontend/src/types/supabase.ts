export interface Question {
  id: string
  title: string
  description?: string
  category: string
  image_url: string
  coin: 'PSG' | 'BAR'
  status: 'open' | 'closed' | 'resolved'
  end_time?: string
  created_at: string
  updated_at: string
}

export interface CreateQuestionData {
  title: string
  description?: string
  category: string
  image_url: string
  coin: 'PSG' | 'BAR'
  end_time: string
}

export interface Bet {
  id: string
  question_id: string
  wallet_address: string
  outcome: 'YES' | 'NO'
  amount: string
  status: 'pending' | 'won' | 'lost' | 'cancelled'
  created_at: string
  resolved_at?: string
  winnings: string
  market_address?: string
}

export interface CreateBetData {
  question_id: string
  wallet_address: string
  outcome: 'YES' | 'NO'
  amount: string
  market_address?: string
}

export interface Market {
  id: string
  question_id: string
  bet_id: string
  token_address: string
  token_symbol: 'PSG' | 'BAR'
  market_address?: string
  creator_address: string
  end_time: string
  resolved: boolean
  outcome: number // 0: not resolved, 1: YES, 2: NO
  total_yes: string
  total_no: string
  created_at: string
  updated_at: string
}

export interface CreateMarketData {
  question_id: string
  bet_id: string
  token_address: string
  token_symbol: 'PSG' | 'BAR'
  creator_address: string
  end_time: string
}

export interface User {
  id: string
  email: string
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
} 