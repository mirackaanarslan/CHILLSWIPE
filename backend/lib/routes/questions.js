"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionsRouter = void 0;
const express_1 = require("express");
const firestore_1 = require("firebase-admin/firestore");
const shared_1 = require("@prediction-market/shared");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const question_1 = require("../schemas/question");
const router = (0, express_1.Router)();
exports.questionsRouter = router;
const db = (0, firestore_1.getFirestore)();
// GET /questions - Fetch all questions with pagination and filtering
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, marketId, categoryId, isActive, questionType } = req.query;
        let query = db.collection('questions');
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
                .where('status', '==', shared_1.MarketStatus.ACTIVE)
                .get();
            const marketIds = marketsSnapshot.docs.map(doc => doc.id);
            if (marketIds.length > 0) {
                query = query.where('marketId', 'in', marketIds);
            }
            else {
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
                });
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
        const questions = [];
        for (const doc of snapshot.docs) {
            const questionData = doc.data();
            questions.push({
                id: doc.id,
                ...questionData,
                createdAt: questionData.createdAt.toDate(),
                updatedAt: questionData.updatedAt.toDate()
            });
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
        });
    }
    catch (error) {
        console.error('Error fetching questions:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch questions'
        });
    }
});
// GET /questions/:id - Fetch single question
router.get('/:id', async (req, res) => {
    try {
        const questionDoc = await db.collection('questions').doc(req.params.id).get();
        if (!questionDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Question not found'
            });
        }
        const questionData = questionDoc.data();
        const question = {
            id: questionDoc.id,
            ...questionData,
            createdAt: questionData.createdAt.toDate(),
            updatedAt: questionData.updatedAt.toDate()
        };
        res.json({
            success: true,
            data: question
        });
    }
    catch (error) {
        console.error('Error fetching question:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch question'
        });
    }
});
// POST /questions - Create new question (Admin only)
router.post('/', auth_1.authenticateUser, auth_1.requireAdmin, (0, validation_1.validateRequest)(question_1.questionValidationSchema), async (req, res) => {
    try {
        const questionRequest = req.body;
        // Verify market exists and is active
        const marketDoc = await db.collection('markets').doc(questionRequest.marketId).get();
        if (!marketDoc.exists) {
            return res.status(400).json({
                success: false,
                error: 'Market not found'
            });
        }
        const marketData = marketDoc.data();
        if (marketData.status !== shared_1.MarketStatus.ACTIVE) {
            return res.status(400).json({
                success: false,
                error: 'Cannot add questions to inactive market'
            });
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
        const newQuestion = {
            id: questionRef.id,
            ...questionData
        };
        res.status(201).json({
            success: true,
            data: newQuestion,
            message: 'Question created successfully'
        });
    }
    catch (error) {
        console.error('Error creating question:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to create question'
        });
    }
});
// PUT /questions/:id - Update question (Admin only)
router.put('/:id', auth_1.authenticateUser, auth_1.requireAdmin, async (req, res) => {
    try {
        const questionRef = db.collection('questions').doc(req.params.id);
        const questionDoc = await questionRef.get();
        if (!questionDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Question not found'
            });
        }
        const updateData = {
            ...req.body,
            updatedAt: new Date()
        };
        await questionRef.update(updateData);
        const updatedDoc = await questionRef.get();
        const updatedData = updatedDoc.data();
        const updatedQuestion = {
            id: updatedDoc.id,
            ...updatedData,
            createdAt: updatedData.createdAt.toDate(),
            updatedAt: updatedData.updatedAt.toDate()
        };
        res.json({
            success: true,
            data: updatedQuestion,
            message: 'Question updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating question:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to update question'
        });
    }
});
// DELETE /questions/:id - Soft delete question (Admin only)
router.delete('/:id', auth_1.authenticateUser, auth_1.requireAdmin, async (req, res) => {
    try {
        const questionRef = db.collection('questions').doc(req.params.id);
        const questionDoc = await questionRef.get();
        if (!questionDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Question not found'
            });
        }
        // Soft delete by setting isActive to false
        await questionRef.update({
            isActive: false,
            updatedAt: new Date()
        });
        res.json({
            success: true,
            message: 'Question deactivated successfully'
        });
    }
    catch (error) {
        console.error('Error deleting question:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to delete question'
        });
    }
});
//# sourceMappingURL=questions.js.map