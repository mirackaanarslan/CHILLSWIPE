import { questionsService, marketsService, betsService, storageService } from './supabase-service'
import { CreateQuestionData, Question, CreateMarketData, Market, CreateBetData, Bet } from '@/types/supabase'
import { PredictionFactory } from '@/contracts/PredictionFactory'
import { ethers } from 'ethers'

// Token address mapping
const TOKEN_ADDRESSES = {
  PSG: '0xd2E815c3870a1fC2ED71D3C3355EAE5FF728F630',
  BAR: '0x21FD1F8067C9a418eD8447f633f5C9b2E01EbAe0'
} as const;

// Factory address
const FACTORY_ADDRESS = '0x5A33587851f14678fF96C9682Cc868ce5BaC3Ec5';

// Simple admin auth check
const checkAdminAuth = (): boolean => {
  const adminSession = localStorage.getItem('admin_session')
  return !!adminSession
}

// Add a new question and create associated market and bet
export const addQuestion = async (questionData: CreateQuestionData): Promise<string> => {
  try {
    if (!checkAdminAuth()) {
      throw new Error('Admin authentication required')
    }
    
    console.log('=== ADD QUESTION DEBUG ===')
    console.log('Adding question with data:', questionData)
    
    // Validate required fields
    if (!questionData.title?.trim()) {
      throw new Error('Question title is required')
    }
    
    if (!questionData.image_url?.trim()) {
      throw new Error('Question image is required')
    }
    
    if (!questionData.category?.trim()) {
      throw new Error('Question category is required')
    }
    
    if (!questionData.coin) {
      throw new Error('Question coin is required')
    }

    if (!questionData.end_time) {
      throw new Error('End time is required')
    }
    
    // Create the question first
    const question = await questionsService.create(questionData)
    console.log('✅ Question added successfully with ID:', question.id)
    

    
    // Create the market in database first (without contract address)
    const marketData: CreateMarketData = {
      question_id: question.id,
      token_address: TOKEN_ADDRESSES[questionData.coin],
      token_symbol: questionData.coin,
      creator_address: '0x0000000000000000000000000000000000000000', // Will be set when contract is deployed
      end_time: questionData.end_time
    }
    
    console.log('🔄 Creating market in database with data:', marketData)
    const market = await marketsService.create(marketData)
    console.log('✅ Market created in database with ID:', market.id)
    console.log('📋 Market data:', market)
    
    console.log('=== END ADD QUESTION DEBUG ===')
    return question.id
  } catch (error: any) {
    console.error('❌ Error adding question:', error)
    throw new Error(error.message || 'Failed to add question')
  }
}

// Create real market contract using PredictionFactory
export const createMarketContract = async (
  questionTitle: string,
  tokenSymbol: 'PSG' | 'BAR',
  endTime: string,
  walletClient: any
): Promise<string> => {
  try {
    console.log('=== CREATE MARKET CONTRACT DEBUG ===')
    console.log('Creating market contract for:', { questionTitle, tokenSymbol, endTime })
    
    if (!walletClient) {
      throw new Error('Wallet client is required')
    }
    
    // Convert wagmi client to ethers provider
    const provider = new ethers.BrowserProvider(walletClient as any)
    const signer = await provider.getSigner()
    
    console.log('✅ Provider and signer created')
    
    // Create PredictionFactory instance
    const factory = new PredictionFactory(provider, FACTORY_ADDRESS, signer)
    console.log('✅ PredictionFactory created with address:', FACTORY_ADDRESS)
    
    // Convert end time to timestamp
    const endTimeTimestamp = Math.floor(new Date(endTime).getTime() / 1000)
    console.log('📋 End time timestamp:', endTimeTimestamp)
    
    // Get token address
    const tokenAddress = TOKEN_ADDRESSES[tokenSymbol]
    console.log('📋 Token address:', tokenAddress)
    
    // Create market contract
    console.log('🔄 Creating market contract...')
    const receipt = await factory.createMarket(questionTitle, tokenAddress, endTimeTimestamp)
    console.log('✅ Transaction confirmed:', receipt.hash)
    
    // Get the created market address from the event
    const marketCreatedEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = factory.contract.interface.parseLog(log)
        return parsed.name === 'MarketCreated'
      } catch {
        return false
      }
    })
    
    if (!marketCreatedEvent) {
      throw new Error('MarketCreated event not found in transaction receipt')
    }
    
    const parsedEvent = factory.contract.interface.parseLog(marketCreatedEvent)
    const marketAddress = parsedEvent.args[0] // First argument is market address
    
    console.log('✅ Market contract created at address:', marketAddress)
    console.log('=== END CREATE MARKET CONTRACT DEBUG ===')
    
    return marketAddress
  } catch (error: any) {
    console.error('❌ Error creating market contract:', error)
    throw new Error(error.message || 'Failed to create market contract')
  }
}

// Get market by question ID
export const getMarketByQuestionId = async (questionId: string): Promise<Market | null> => {
  try {
    console.log('Fetching market by question ID:', questionId)
    const markets = await marketsService.getByQuestionId(questionId)
    console.log('Fetched markets:', markets.length)
    return markets.length > 0 ? markets[0] : null
  } catch (error: any) {
    console.error('Error getting market by question ID:', error)
    throw new Error(error.message || 'Failed to get market')
  }
}

// Update market with real contract address
export const updateMarketWithContractAddress = async (
  marketId: string,
  contractAddress: string,
  creatorAddress: string
): Promise<void> => {
  try {
    console.log('🔄 Updating market with contract address:', { marketId, contractAddress, creatorAddress })
    
    await marketsService.update(marketId, {
      market_address: contractAddress,
      creator_address: creatorAddress
    })
    
    console.log('✅ Market updated with contract address')
  } catch (error: any) {
    console.error('❌ Error updating market with contract address:', error)
    throw new Error(error.message || 'Failed to update market with contract address')
  }
}

// Create a new bet
export const createBet = async (betData: CreateBetData): Promise<string> => {
  try {
    console.log('Creating bet with data:', betData)
    
    // Validate required fields
    if (!betData.question_id) {
      throw new Error('Question ID is required')
    }
    
    if (!betData.wallet_address) {
      throw new Error('Wallet address is required')
    }
    
    if (!betData.outcome) {
      throw new Error('Outcome is required')
    }
    
    if (!betData.amount || parseFloat(betData.amount) <= 0) {
      throw new Error('Valid amount is required')
    }
    
    const bet = await betsService.create(betData)
    console.log('Bet created successfully with ID:', bet.id)
    
    return bet.id
  } catch (error: any) {
    console.error('Error creating bet:', error)
    throw new Error(error.message || 'Failed to create bet')
  }
}

// Get all bets
export const getAllBets = async (): Promise<Bet[]> => {
  try {
    console.log('Fetching all bets')
    const bets = await betsService.getAll()
    console.log('Fetched bets:', bets.length)
    return bets
  } catch (error: any) {
    console.error('Error getting bets:', error)
    throw new Error(error.message || 'Failed to get bets')
  }
}

// Get bets by question ID
export const getBetsByQuestionId = async (questionId: string): Promise<Bet[]> => {
  try {
    console.log('Fetching bets for question:', questionId)
    const bets = await betsService.getByQuestionId(questionId)
    console.log('Fetched bets:', bets.length)
    return bets
  } catch (error: any) {
    console.error('Error getting bets by question ID:', error)
    throw new Error(error.message || 'Failed to get bets')
  }
}

// Get bets by wallet address
export const getBetsByWalletAddress = async (walletAddress: string): Promise<Bet[]> => {
  try {
    console.log('Fetching bets for wallet:', walletAddress)
    const bets = await betsService.getByWalletAddress(walletAddress)
    console.log('Fetched bets:', bets.length)
    return bets
  } catch (error: any) {
    console.error('Error getting bets by wallet address:', error)
    throw new Error(error.message || 'Failed to get bets')
  }
}

// Update a question
export const updateQuestion = async (questionId: string, updates: Partial<CreateQuestionData>): Promise<void> => {
  try {
    if (!checkAdminAuth()) {
      throw new Error('Admin authentication required')
    }
    
    console.log('Updating question:', questionId, 'with data:', updates)
    
    // Validate required fields if they're being updated
    if (updates.title !== undefined && !updates.title?.trim()) {
      throw new Error('Question title is required')
    }
    
    if (updates.category !== undefined && !updates.category?.trim()) {
      throw new Error('Question category is required')
    }
    
    if (updates.coin !== undefined && !updates.coin) {
      throw new Error('Question coin is required')
    }
    
    await questionsService.update(questionId, updates)
    console.log('Question updated successfully')
  } catch (error: any) {
    console.error('Error updating question:', error)
    throw new Error(error.message || 'Failed to update question')
  }
}

// Delete a question
export const deleteQuestion = async (questionId: string): Promise<void> => {
  try {
    if (!checkAdminAuth()) {
      throw new Error('Admin authentication required')
    }
    
    console.log('Deleting question:', questionId)
    await questionsService.delete(questionId)
    console.log('Question deleted successfully')
  } catch (error: any) {
    console.error('Error deleting question:', error)
    throw new Error(error.message || 'Failed to delete question')
  }
}

// Get all questions
export const getAllQuestions = async (): Promise<Question[]> => {
  try {
    console.log('Fetching all questions')
    const questions = await questionsService.getAll()
    console.log('Fetched questions:', questions.length)
    return questions
  } catch (error: any) {
    console.error('Error getting questions:', error)
    throw new Error(error.message || 'Failed to get questions')
  }
}

// Get all markets
export const getAllMarkets = async (): Promise<Market[]> => {
  try {
    console.log('Fetching all markets')
    const markets = await marketsService.getAll()
    console.log('Fetched markets:', markets.length)
    return markets
  } catch (error: any) {
    console.error('Error getting markets:', error)
    throw new Error(error.message || 'Failed to get markets')
  }
}

// Get unresolved markets for resolve bets
export const getUnresolvedMarkets = async (): Promise<Market[]> => {
  try {
    console.log('Fetching unresolved markets')
    const markets = await marketsService.getUnresolved()
    console.log('Fetched unresolved markets:', markets.length)
    return markets
  } catch (error: any) {
    console.error('Error getting unresolved markets:', error)
    throw new Error(error.message || 'Failed to get unresolved markets')
  }
}

// Get unresolved markets with question details
export const getUnresolvedMarketsWithQuestions = async (): Promise<(Market & { question: Question })[]> => {
  try {
    console.log('=== GET UNRESOLVED MARKETS WITH QUESTIONS DEBUG ===')
    console.log('Fetching unresolved markets with questions')
    const markets = await marketsService.getUnresolved()
    console.log('📋 Raw markets from database:', markets.length)
    console.log('📋 Raw markets data:', markets)
    
    // Get question details for each market
    const marketsWithQuestions = await Promise.all(
      markets.map(async (market) => {
        console.log(`🔄 Processing market ${market.id} with question_id: ${market.question_id}`)
        try {
          const question = await questionsService.getById(market.question_id)
          console.log(`✅ Question found for market ${market.id}:`, question)
          return { ...market, question }
        } catch (error) {
          console.error(`❌ Failed to get question for market ${market.id}:`, error)
          console.error(`❌ Question ID was: ${market.question_id}`)
          return { ...market, question: null }
        }
      })
    )
    
    console.log('📋 Markets with questions processed:', marketsWithQuestions.length)
    console.log('📋 Markets with questions data:', marketsWithQuestions)
    
    const validMarkets = marketsWithQuestions.filter(m => m.question !== null) as (Market & { question: Question })[]
    console.log('✅ Valid markets with questions:', validMarkets.length)
    console.log('✅ Valid markets data:', validMarkets)
    console.log('=== END GET UNRESOLVED MARKETS WITH QUESTIONS DEBUG ===')
    
    return validMarkets
  } catch (error: any) {
    console.error('❌ Error getting unresolved markets with questions:', error)
    throw new Error(error.message || 'Failed to get unresolved markets with questions')
  }
}

// Update market with contract address
export const updateMarketAddress = async (marketId: string, marketAddress: string): Promise<void> => {
  try {
    if (!checkAdminAuth()) {
      throw new Error('Admin authentication required')
    }
    
    console.log('Updating market address:', marketId, marketAddress)
    await marketsService.update(marketId, { market_address: marketAddress })
    console.log('Market address updated successfully')
  } catch (error: any) {
    console.error('Error updating market address:', error)
    throw new Error(error.message || 'Failed to update market address')
  }
}

// Get question by ID
export const getQuestionById = async (questionId: string): Promise<Question> => {
  try {
    console.log('Fetching question by ID:', questionId)
    const question = await questionsService.getById(questionId)
    console.log('Fetched question:', question)
    return question
  } catch (error: any) {
    console.error('Error getting question by ID:', error)
    throw new Error(error.message || 'Failed to get question')
  }
}

// Get market by ID
export const getMarketById = async (marketId: string): Promise<Market> => {
  try {
    console.log('Fetching market by ID:', marketId)
    const market = await marketsService.getById(marketId)
    console.log('Fetched market:', market)
    return market
  } catch (error: any) {
    console.error('Error getting market by ID:', error)
    throw new Error(error.message || 'Failed to get market')
  }
}

// Get bet by ID
export const getBetById = async (betId: string): Promise<Bet> => {
  try {
    console.log('Fetching bet by ID:', betId)
    const bet = await betsService.getById(betId)
    console.log('Fetched bet:', bet)
    return bet
  } catch (error: any) {
    console.error('Error getting bet by ID:', error)
    throw new Error(error.message || 'Failed to get bet')
  }
}

// Upload image and return URL
export const uploadQuestionImage = async (file: File): Promise<string> => {
  try {
    if (!checkAdminAuth()) {
      throw new Error('Admin authentication required')
    }
    
    console.log('Uploading image:', file.name)
    const fileName = `${Date.now()}-${file.name}`
    const imageUrl = await storageService.uploadImage(file, fileName)
    console.log('Image uploaded successfully:', imageUrl)
    return imageUrl
  } catch (error: any) {
    console.error('Error uploading image:', error)
    throw new Error(error.message || 'Failed to upload image')
  }
}

// Helper function to validate question data
export const validateQuestionData = (data: CreateQuestionData): string[] => {
  const errors: string[] = []
  
  if (!data.title?.trim()) {
    errors.push('Question title is required')
  }
  
  if (!data.image_url?.trim()) {
    errors.push('Question image is required')
  }
  
  if (!data.category?.trim()) {
    errors.push('Question category is required')
  }
  
  if (!data.coin) {
    errors.push('Question coin is required')
  }

  if (!data.end_time) {
    errors.push('End time is required')
  }
  
  return errors
}

// Get token address for coin
export const getTokenAddress = (coin: 'PSG' | 'BAR'): string => {
  return TOKEN_ADDRESSES[coin]
}

// Get market address for a specific question
export const getMarketAddressForQuestion = async (questionId: string, questionTitle?: string): Promise<string | null> => {
  try {
    console.log('Getting market address for question:', questionId, 'title:', questionTitle)
    
    // First try to get market by question ID
    const market = await getMarketByQuestionId(questionId)
    
    if (market && market.market_address) {
      console.log('Found market address:', market.market_address)
      return market.market_address
    }
    
    // If no market found by ID, try to find by title (fallback)
    if (questionTitle) {
      console.log('No market found by ID, trying to find by title:', questionTitle)
      const allMarkets = await getAllMarkets()
      
      // Find market by matching question title
      const matchingMarket = allMarkets.find(market => {
        // This is a fallback - ideally we should have the question_id
        // For now, we'll return null if no market found by ID
        return false
      })
      
      if (matchingMarket && matchingMarket.market_address) {
        console.log('Found market address by title:', matchingMarket.market_address)
        return matchingMarket.market_address
      }
    }
    
    console.log('No market address found for question:', questionId)
    return null
  } catch (error: any) {
    console.error('Error getting market address for question:', error)
    return null
  }
} 