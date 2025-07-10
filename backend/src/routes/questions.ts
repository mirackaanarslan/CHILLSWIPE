import { Router, Response } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { 
  Question, 
  CreateQuestionRequest, 
  ApiResponse, 
  PaginatedResponse,
  MarketStatus
} from '@prediction-market/shared';
import { authenticateUser, requireAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { questionValidationSchema } from '../schemas/question';

const router = Router();
const db = getFirestore();

// GET /questions - Fetch all questions with pagination and filtering
router.get('/', async (req, res): Promise<Response | void> => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      marketId, 
      categoryId, 
      isActive,
      questionType 
    } = req.query;

    let query: any = db.collection('questions');

    // Apply filters
    if (marketId) {
      query = query.where('marketId', '==', marketId);
    }
    
    if (isActive !== undefined) {
      query = query.where('isActive', '==', isActive === 'true');
    }
    
    if (questionType) {
      query = query.where('questionType', '==', questionType);
    }

    // If categoryId is provided, first get markets in that category
    if (categoryId) {
      const marketsSnapshot = await db.collection('markets')
        .where('categoryId', '==', categoryId)
        .where('status', '==', MarketStatus.ACTIVE)
        .get();
      
      const marketIds = marketsSnapshot.docs.map(doc => doc.id);
      if (marketIds.length > 0) {
        query = query.where('marketId', 'in', marketIds);
      } else {
        // No markets in this category, return empty result
        return res.json({
          success: true,
          data: {
            items: [],
            total: 0,
            page: Number(page),
            limit: Number(limit),
            hasMore: false
          }
        } as ApiResponse<PaginatedResponse<Question>>);
      }
    }

    // Order by creation date
    query = query.orderBy('createdAt', 'desc');

    // Calculate offset for pagination
    const offset = (Number(page) - 1) * Number(limit);
    
    // Get total count
    const totalSnapshot = await query.get();
    const total = totalSnapshot.size;

    // Apply pagination
    const snapshot = await query
      .offset(offset)
      .limit(Number(limit))
      .get();

    const questions: Question[] = [];
    
    for (const doc of snapshot.docs) {
      const questionData = doc.data();
      questions.push({
        id: doc.id,
        ...questionData,
        createdAt: questionData.createdAt.toDate(),
        updatedAt: questionData.updatedAt.toDate()
      } as Question);
    }

    const hasMore = offset + questions.length < total;

    res.json({
      success: true,
      data: {
        items: questions,
        total,
        page: Number(page),
        limit: Number(limit),
        hasMore
      }
    } as ApiResponse<PaginatedResponse<Question>>);

  } catch (error) {
    console.error('Error fetching questions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch questions'
    } as ApiResponse<null>);
  }
});

// GET /questions/:id - Fetch single question
router.get('/:id', async (req, res): Promise<Response | void> => {
  try {
    const questionDoc = await db.collection('questions').doc(req.params.id).get();
    
    if (!questionDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      } as ApiResponse<null>);
    }

    const questionData = questionDoc.data()!;
    const question: Question = {
      id: questionDoc.id,
      ...questionData,
      createdAt: questionData.createdAt.toDate(),
      updatedAt: questionData.updatedAt.toDate()
    } as Question;

    res.json({
      success: true,
      data: question
    } as ApiResponse<Question>);

  } catch (error) {
    console.error('Error fetching question:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch question'
    } as ApiResponse<null>);
  }
});

// POST /questions - Create new question (Admin only)
router.post('/', 
  authenticateUser,
  requireAdmin,
  validateRequest(questionValidationSchema),
  async (req, res): Promise<Response | void> => {
    try {
      const questionRequest: CreateQuestionRequest = req.body;
      
      // Verify market exists and is active
      const marketDoc = await db.collection('markets').doc(questionRequest.marketId).get();
      if (!marketDoc.exists) {
        return res.status(400).json({
          success: false,
          error: 'Market not found'
        } as ApiResponse<null>);
      }

      const marketData = marketDoc.data()!;
      if (marketData.status !== MarketStatus.ACTIVE) {
        return res.status(400).json({
          success: false,
          error: 'Cannot add questions to inactive market'
        } as ApiResponse<null>);
      }

      const now = new Date();
      const questionData = {
        ...questionRequest,
        options: questionRequest.options.map((option, index) => ({
          id: `option_${index + 1}`,
          text: option.text,
          probability: 1 / questionRequest.options.length, // Equal initial probability
          totalBets: 0,
          totalAmount: 0
        })),
        isActive: true,
        totalBets: 0,
        createdAt: now,
        updatedAt: now
      };

      const questionRef = await db.collection('questions').add(questionData);
      
      const newQuestion: Question = {
        id: questionRef.id,
        ...questionData
      } as Question;

      res.status(201).json({
        success: true,
        data: newQuestion,
        message: 'Question created successfully'
      } as ApiResponse<Question>);

    } catch (error) {
      console.error('Error creating question:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create question'
      } as ApiResponse<null>);
    }
  }
);

// PUT /questions/:id - Update question (Admin only)
router.put('/:id',
  authenticateUser,
  requireAdmin,
  async (req, res): Promise<Response | void> => {
    try {
      const questionRef = db.collection('questions').doc(req.params.id);
      const questionDoc = await questionRef.get();
      
      if (!questionDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Question not found'
        } as ApiResponse<null>);
      }

      const updateData = {
        ...req.body,
        updatedAt: new Date()
      };

      await questionRef.update(updateData);

      const updatedDoc = await questionRef.get();
      const updatedData = updatedDoc.data()!;
      
      const updatedQuestion: Question = {
        id: updatedDoc.id,
        ...updatedData,
        createdAt: updatedData.createdAt.toDate(),
        updatedAt: updatedData.updatedAt.toDate()
      } as Question;

      res.json({
        success: true,
        data: updatedQuestion,
        message: 'Question updated successfully'
      } as ApiResponse<Question>);

    } catch (error) {
      console.error('Error updating question:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update question'
      } as ApiResponse<null>);
    }
  }
);

// DELETE /questions/:id - Soft delete question (Admin only)
router.delete('/:id',
  authenticateUser,
  requireAdmin,
  async (req, res): Promise<Response | void> => {
    try {
      const questionRef = db.collection('questions').doc(req.params.id);
      const questionDoc = await questionRef.get();
      
      if (!questionDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Question not found'
        } as ApiResponse<null>);
      }

      // Soft delete by setting isActive to false
      await questionRef.update({
        isActive: false,
        updatedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Question deactivated successfully'
      } as ApiResponse<null>);

    } catch (error) {
      console.error('Error deleting question:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete question'
      } as ApiResponse<null>);
    }
  }
);

export { router as questionsRouter }; 