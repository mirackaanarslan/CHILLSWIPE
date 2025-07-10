"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.betsRouter = void 0;
const express_1 = require("express");
const firestore_1 = require("firebase-admin/firestore");
const shared_1 = require("@prediction-market/shared");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const bet_1 = require("../schemas/bet");
const router = (0, express_1.Router)();
exports.betsRouter = router;
const db = (0, firestore_1.getFirestore)();
// POST /bets - Place a new bet
router.post('/', auth_1.authenticateUser, (0, validation_1.validateRequest)(bet_1.placeBetValidationSchema), async (req, res) => {
    try {
        const betRequest = req.body;
        const userId = req.user.uid;
        // 1. Validate user has sufficient balance
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        const userData = userDoc.data();
        if (userData.balance < betRequest.amount) {
            return res.status(400).json({
                success: false,
                error: 'Insufficient balance'
            });
        }
        // 2. Validate question and option exist
        const questionDoc = await db.collection('questions').doc(betRequest.questionId).get();
        if (!questionDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Question not found'
            });
        }
        const questionData = questionDoc.data();
        if (!questionData.isActive) {
            return res.status(400).json({
                success: false,
                error: 'Question is not active'
            });
        }
        const option = questionData.options.find(opt => opt.id === betRequest.optionId);
        if (!option) {
            return res.status(404).json({
                success: false,
                error: 'Option not found'
            });
        }
        // 3. Calculate odds and potential payout
        const odds = calculateOdds(questionData.options, betRequest.optionId);
        const potentialPayout = betRequest.amount * odds;
        // 4. Create bet document
        const now = new Date();
        const betData = {
            userId,
            questionId: betRequest.questionId,
            optionId: betRequest.optionId,
            amount: betRequest.amount,
            odds,
            potentialPayout,
            status: shared_1.BetStatus.ACTIVE,
            placedAt: now
        };
        const betRef = await db.collection('bets').add(betData);
        const newBet = {
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
        const updatedOptions = questionData.options.map(opt => opt.id === betRequest.optionId
            ? { ...opt, totalBets: opt.totalBets + 1, totalAmount: opt.totalAmount + betRequest.amount }
            : opt);
        await db.collection('questions').doc(betRequest.questionId).update({
            options: updatedOptions,
            totalBets: questionData.totalBets + 1,
            updatedAt: now
        });
        // 7. Create transaction record
        await db.collection('transactions').add({
            userId,
            type: shared_1.TransactionType.BET_PLACED,
            amount: -betRequest.amount,
            description: `Bet placed on question: ${questionData.title}`,
            relatedBetId: betRef.id,
            createdAt: now
        });
        res.status(201).json({
            success: true,
            data: newBet,
            message: 'Bet placed successfully'
        });
    }
    catch (error) {
        console.error('Error placing bet:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to place bet'
        });
    }
});
// GET /bets - Get user's bets
router.get('/', auth_1.authenticateUser, async (req, res) => {
    try {
        const userId = req.user.uid;
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
        const bets = [];
        for (const doc of snapshot.docs) {
            const betData = doc.data();
            bets.push({
                id: doc.id,
                ...betData,
                placedAt: betData.placedAt.toDate(),
                resolvedAt: betData.resolvedAt?.toDate()
            });
        }
        res.json({
            success: true,
            data: bets
        });
    }
    catch (error) {
        console.error('Error fetching bets:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch bets'
        });
    }
});
// GET /bets/:id - Get specific bet
router.get('/:id', auth_1.authenticateUser, async (req, res) => {
    try {
        const betDoc = await db.collection('bets').doc(req.params.id).get();
        if (!betDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Bet not found'
            });
        }
        const betData = betDoc.data();
        const bet = {
            id: betDoc.id,
            ...betData,
            placedAt: betData.placedAt.toDate(),
            resolvedAt: betData.resolvedAt?.toDate()
        };
        res.json({
            success: true,
            data: bet
        });
    }
    catch (error) {
        console.error('Error fetching bet:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch bet'
        });
    }
});
// Helper function to calculate odds
function calculateOdds(options, selectedOptionId) {
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
//# sourceMappingURL=bets.js.map