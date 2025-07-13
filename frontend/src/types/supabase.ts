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
  status: 'pending' | 'won' | 'lost' | 'cancelled' | 'claimed'
  created_at: string
  resolved_at?: string
  winnings: string
  market_address?: string
  questions?: Question
}

export interface CreateBetData {
  question_id: string
  wallet_address: string
  outcome: 'YES' | 'NO'
  amount: string
  market_address?: string
  transaction_hash?: string
  coin?: 'PSG' | 'BAR'
  status?: 'pending' | 'won' | 'lost' | 'cancelled' | 'claimed'
}

export interface Market {
  id: string
  question_id: string
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
  token_address: string
  token_symbol: 'PSG' | 'BAR'
  creator_address: string
  end_time: string
}

export interface User {
  id: string
  wallet_address: string
  created_at: string
  updated_at: string
  total_swipes: number
  correct_predictions: number
  win_rate: string
  total_winnings: string
  favorite_team?: string
  last_active: string
  is_premium: boolean
} 