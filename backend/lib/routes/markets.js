"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketsRouter = void 0;
const express_1 = require("express");
const firestore_1 = require("firebase-admin/firestore");
const router = (0, express_1.Router)();
exports.marketsRouter = router;
const db = (0, firestore_1.getFirestore)();
// GET /markets - Fetch all markets
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('markets')
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();
        const markets = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        }));
        res.json({
            success: true,
            data: markets
        });
    }
    catch (error) {
        console.error('Error fetching markets:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch markets'
        });
    }
});
//# sourceMappingURL=markets.js.map