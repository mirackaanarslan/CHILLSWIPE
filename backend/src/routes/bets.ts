import { Router } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { 
  Bet, 
  PlaceBetRequest, 
  ApiResponse, 
  BetStatus,
  TransactionType,
  User,
  Question,
  QuestionOption
} from '@prediction-market/shared';
import { authenticateUser } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { placeBetValidationSchema } from '../schemas/bet';

const router = Router();
const db = getFirestore();

// POST /bets - Place a new bet
router.post('/', 
  authenticateUser,
  validateRequest(placeBetValidationSchema),
  async (req, res) => {
    try {
      const betRequest: PlaceBetRequest = req.body;
      const userId = req.user!.uid;

      // 1. Validate user has sufficient balance
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        } as ApiResponse<null>);
      }

      const userData = userDoc.data()! as User;
      if (userData.balance < betRequest.amount) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient balance'
        } as ApiResponse<null>);
      }

      // 2. Validate question and option exist
      const questionDoc = await db.collection('questions').doc(betRequest.questionId).get();
      if (!questionDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Question not found'
        } as ApiResponse<null>);
      }

      const questionData = questionDoc.data()! as Question;
      if (!questionData.isActive) {
        return res.status(400).json({
          success: false,
          error: 'Question is not active'
        } as ApiResponse<null>);
      }

      const option = questionData.options.find(opt => opt.id === betRequest.optionId);
      if (!option) {
        return res.status(404).json({
          success: false,
          error: 'Option not found'
        } as ApiResponse<null>);
      }

      // 3. Calculate odds and potential payout
      const odds = calculateOdds(questionData.options, betRequest.optionId);
      const potentialPayout = betRequest.amount * odds;

      // 4. Create bet document
      const now = new Date();
      const betData: Omit<Bet, 'id'> = {
        userId,
        questionId: betRequest.questionId,
        optionId: betRequest.optionId,
        amount: betRequest.amount,
        odds,
        potentialPayout,
        status: BetStatus.ACTIVE,
        placedAt: now
      };

      const betRef = await db.collection('bets').add(betData);
      const newBet: Bet = {
        id: betRef.id,
        ...betData
      };

      // 5. Update user balance
      await db.collection('users').doc(userId).update({
        balance: userData.balance - betRequest.amount,
        totalBets: userData.totalBets + 1,
        updatedAt: now
      });

      // 6. Update question statistics
      const updatedOptions = questionData.options.map(opt => 
        opt.id === betRequest.optionId 
          ? { ...opt, totalBets: opt.totalBets + 1, totalAmount: opt.totalAmount + betRequest.amount }
          : opt
      );

      await db.collection('questions').doc(betRequest.questionId).update({
        options: updatedOptions,
        totalBets: questionData.totalBets + 1,
        updatedAt: now
      });

      // 7. Create transaction record
      await db.collection('transactions').add({
        userId,
        type: TransactionType.BET_PLACED,
        amount: -betRequest.amount,
        description: `Bet placed on question: ${questionData.title}`,
        relatedBetId: betRef.id,
        createdAt: now
      });

      res.status(201).json({
        success: true,
        data: newBet,
        message: 'Bet placed successfully'
      } as ApiResponse<Bet>);

    } catch (error) {
      console.error('Error placing bet:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to place bet'
      } as ApiResponse<null>);
    }
  }
);

// GET /bets - Get user's bets
router.get('/', 
  authenticateUser,
  async (req, res) => {
    try {
      const userId = req.user!.uid;
      const { status, limit = 20, page = 1 } = req.query;

      let query = db.collection('bets').where('userId', '==', userId);

      if (status) {
        query = query.where('status', '==', status);
      }

      query = query.orderBy('placedAt', 'desc');

      const offset = (Number(page) - 1) * Number(limit);
      const snapshot = await query
        .offset(offset)
        .limit(Number(limit))
        .get();

      const bets: Bet[] = [];
      for (const doc of snapshot.docs) {
        const betData = doc.data();
        bets.push({
          id: doc.id,
          ...betData,
          placedAt: betData.placedAt.toDate(),
          resolvedAt: betData.resolvedAt?.toDate()
        } as Bet);
      }

      res.json({
        success: true,
        data: bets
      } as ApiResponse<Bet[]>);

    } catch (error) {
      console.error('Error fetching bets:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch bets'
      } as ApiResponse<null>);
    }
  }
);

// GET /bets/:id - Get specific bet
router.get('/:id', 
  authenticateUser,
  async (req, res) => {
    try {
      const betDoc = await db.collection('bets').doc(req.params.id).get();
      
      if (!betDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Bet not found'
        } as ApiResponse<null>);
      }

      const betData = betDoc.data()!;
      const bet: Bet = {
        id: betDoc.id,
        ...betData,
        placedAt: betData.placedAt.toDate(),
        resolvedAt: betData.resolvedAt?.toDate()
      } as Bet;

      res.json({
        success: true,
        data: bet
      } as ApiResponse<Bet>);

    } catch (error) {
      console.error('Error fetching bet:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch bet'
      } as ApiResponse<null>);
    }
  }
);

// Helper function to calculate odds
function calculateOdds(options: QuestionOption[], selectedOptionId: string): number {
  const totalAmount = options.reduce((sum, opt) => sum + opt.totalAmount, 0);
  const selectedOption = options.find(opt => opt.id === selectedOptionId);
  
  if (!selectedOption || totalAmount === 0) {
    return 2.0; // Default odds
  }

  // Simple odds calculation: total pool / option pool
  const optionPool = selectedOption.totalAmount;
  const odds = totalAmount / optionPool;
  
  // Minimum odds of 1.1
  return Math.max(odds, 1.1);
}

export { router as betsRouter }; 