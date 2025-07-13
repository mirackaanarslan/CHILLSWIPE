import { supabase } from './supabase'
import { Question, CreateQuestionData, Market, CreateMarketData, Bet, CreateBetData, User } from '@/types/supabase'

// Questions CRUD operations
export const questionsService = {
  // Get all questions
  async getAll(): Promise<Question[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching questions:', error)
      throw error
    }
    return data || []
  },

  // Get question by ID
  async getById(id: string): Promise<Question> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching question by ID:', error)
      throw error
    }
    return data
  },

  // Create new question
  async create(questionData: CreateQuestionData): Promise<Question> {
    const { data, error } = await supabase
      .from('questions')
      .insert([questionData])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating question:', error)
      throw error
    }
    return data
  },

  // Update question
  async update(id: string, updates: Partial<CreateQuestionData>): Promise<Question> {
    const { data, error } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating question:', error)
      throw error
    }
    return data
  },

  // Delete question
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting question:', error)
      throw error
    }
  }
}

// Bets CRUD operations
export const betsService = {
  // Get all bets
  async getAll(): Promise<Bet[]> {
    const { data, error } = await supabase
      .from('bets')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching bets:', error)
      throw error
    }
    return data || []
  },

  // Get bets by question ID
  async getByQuestionId(questionId: string): Promise<Bet[]> {
    const { data, error } = await supabase
      .from('bets')
      .select('*')
      .eq('question_id', questionId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching bets by question ID:', error)
      throw error
    }
    return data || []
  },

  // Get bets by wallet address with question details
  async getByWalletAddress(walletAddress: string): Promise<Bet[]> {
    const { data, error } = await supabase
      .from('bets')
      .select(`
        *,
        questions:question_id (
          id,
          title,
          description,
          category,
          coin,
          end_time
        )
      `)
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching bets by wallet address:', error)
      throw error
    }
    return data || []
  },

  // Get bet by ID
  async getById(id: string): Promise<Bet> {
    const { data, error } = await supabase
      .from('bets')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching bet by ID:', error)
      throw error
    }
    return data
  },

  // Create new bet
  async create(betData: CreateBetData): Promise<Bet> {
    const { data, error } = await supabase
      .from('bets')
      .insert([betData])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating bet:', error)
      throw error
    }
    return data
  },

  // Update bet
  async update(id: string, updates: Partial<Bet>): Promise<Bet> {
    console.log(`🔄 Updating bet ${id} with:`, updates);
    
    const { data, error } = await supabase
      .from('bets')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error updating bet:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error
    }
    
    console.log(`✅ Successfully updated bet ${id}:`, data);
    return data
  },

  // Delete bet
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('bets')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting bet:', error)
      throw error
    }
  },

  // Update bet statuses for a question when it's resolved
  async updateBetStatusesForQuestion(questionId: string, outcome: 'YES' | 'NO'): Promise<void> {
    console.log(`Updating bet statuses for question ${questionId} with outcome ${outcome}`);
    
    // Get all bets for this question
    const bets = await this.getByQuestionId(questionId);
    console.log(`Found ${bets.length} bets to update`);
    
    // Update each bet based on outcome
    for (const bet of bets) {
      const newStatus = bet.outcome === outcome ? 'won' : 'lost';
      const winnings = bet.outcome === outcome ? bet.amount : '0';
      
      console.log(`Updating bet ${bet.id}: outcome=${bet.outcome}, newStatus=${newStatus}, winnings=${winnings}`);
      
      await this.update(bet.id, {
        status: newStatus,
        winnings: winnings,
        resolved_at: new Date().toISOString()
      });
    }
    
    console.log(`Successfully updated ${bets.length} bet statuses`);
  }
}

// Users CRUD operations
export const usersService = {
  // Get user by wallet address
  async getByWalletAddress(walletAddress: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No user found
        return null
      }
      console.error('Error fetching user by wallet address:', error)
      throw error
    }
    return data
  },

  // Create new user
  async create(walletAddress: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        wallet_address: walletAddress.toLowerCase(),
        total_swipes: 0,
        correct_predictions: 0,
        win_rate: '0.00',
        total_winnings: '0.00',
        is_premium: false
      }])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating user:', error)
      throw error
    }
    return data
  },

  // Get or create user (upsert)
  async getOrCreate(walletAddress: string): Promise<User> {
    console.log('🔍 Getting or creating user for wallet:', walletAddress)
    
    // Try to get existing user
    const existingUser = await this.getByWalletAddress(walletAddress)
    if (existingUser) {
      console.log('✅ Found existing user:', existingUser.id)
      return existingUser
    }
    
    // Create new user if not found
    console.log('🆕 Creating new user for wallet:', walletAddress)
    const newUser = await this.create(walletAddress)
    console.log('✅ Created new user:', newUser.id)
    return newUser
  },

  // Update user
  async update(walletAddress: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('wallet_address', walletAddress.toLowerCase())
      .select()
      .single()
    
    if (error) {
      console.error('Error updating user:', error)
      throw error
    }
    return data
  },

  // Update last active
  async updateLastActive(walletAddress: string): Promise<void> {
    await this.update(walletAddress, {
      last_active: new Date().toISOString()
    })
  }
}

// Markets CRUD operations
export const marketsService = {
  // Get all markets
  async getAll(): Promise<Market[]> {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching markets:', error)
      throw error
    }
    return data || []
  },

  // Get markets by question ID
  async getByQuestionId(questionId: string): Promise<Market[]> {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .eq('question_id', questionId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching markets by question ID:', error)
      throw error
    }
    return data || []
  },

  // Get unresolved markets
  async getUnresolved(): Promise<Market[]> {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .eq('resolved', false)
      .order('end_time', { ascending: true })
    
    if (error) {
      console.error('Error fetching unresolved markets:', error)
      throw error
    }
    return data || []
  },

  // Get market by ID
  async getById(id: string): Promise<Market> {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching market by ID:', error)
      throw error
    }
    return data
  },

  // Create new market
  async create(marketData: CreateMarketData): Promise<Market> {
    const { data, error } = await supabase
      .from('markets')
      .insert([marketData])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating market:', error)
      throw error
    }
    return data
  },

  // Update market
  async update(id: string, updates: Partial<Market>): Promise<Market> {
    const { data, error } = await supabase
      .from('markets')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating market:', error)
      throw error
    }
    return data
  },

  // Delete market
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('markets')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting market:', error)
      throw error
    }
  }
}

// Storage operations
export const storageService = {
  // Upload image to storage
  async uploadImage(file: File, fileName: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('question-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      console.error('Storage upload error:', error)
      throw error
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('question-images')
      .getPublicUrl(data.path)
    
    return urlData.publicUrl
  },

  // Delete image from storage
  async deleteImage(fileName: string): Promise<void> {
    const { error } = await supabase.storage
      .from('question-images')
      .remove([fileName])
    
    if (error) {
      console.error('Storage delete error:', error)
      throw error
    }
  }
} 