"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserCreated = exports.onMarketStatusChanged = exports.onBetCreated = void 0;
const functions = __importStar(require("firebase-functions"));
const firestore_1 = require("firebase-admin/firestore");
const db = (0, firestore_1.getFirestore)();
// Trigger when a new bet is created
exports.onBetCreated = functions.firestore
    .document('bets/{betId}')
    .onCreate(async (snap, context) => {
    console.log('New bet created:', context.params.betId);
    // TODO: Update question statistics
    // TODO: Recalculate odds
    // TODO: Update user balance
    return null;
});
// Trigger when market status changes
exports.onMarketStatusChanged = functions.firestore
    .document('markets/{marketId}')
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.status !== after.status) {
        console.log(`Market ${context.params.marketId} status changed from ${before.status} to ${after.status}`);
        // TODO: Handle market status changes
        // TODO: Resolve bets if market is resolved
        // TODO: Send notifications
    }
    return null;
});
// Trigger when a new user is created
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
    console.log('New user created:', user.uid);
    // Create user document in Firestore
    await db.collection('users').doc(user.uid).set({
        email: user.email,
        displayName: user.displayName || 'Anonymous User',
        photoURL: user.photoURL || null,
        balance: 1000, // Starting balance
        totalBets: 0,
        totalWinnings: 0,
        reputation: 0,
        createdAt: new Date(),
        updatedAt: new Date()
    });
    return null;
});
//# sourceMappingURL=triggers.js.map