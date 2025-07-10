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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserCreated = exports.onMarketStatusChanged = exports.onBetCreated = exports.sendNotifications = exports.resolveExpiredMarkets = exports.processOddsCalculation = exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
// Initialize Firebase Admin
admin.initializeApp();
// Import route handlers
const questions_1 = require("./routes/questions");
const markets_1 = require("./routes/markets");
const bets_1 = require("./routes/bets");
const users_1 = require("./routes/users");
// Create Express app
const app = (0, express_1.default)();
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use('/questions', questions_1.questionsRouter);
app.use('/markets', markets_1.marketsRouter);
app.use('/bets', bets_1.betsRouter);
app.use('/users', users_1.usersRouter);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'prediction-market-api'
    });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});
// Export the main API function
exports.api = functions.https.onRequest(app);
// Background functions for automation
var background_1 = require("./functions/background");
Object.defineProperty(exports, "processOddsCalculation", { enumerable: true, get: function () { return background_1.processOddsCalculation; } });
Object.defineProperty(exports, "resolveExpiredMarkets", { enumerable: true, get: function () { return background_1.resolveExpiredMarkets; } });
Object.defineProperty(exports, "sendNotifications", { enumerable: true, get: function () { return background_1.sendNotifications; } });
// Firestore triggers
var triggers_1 = require("./functions/triggers");
Object.defineProperty(exports, "onBetCreated", { enumerable: true, get: function () { return triggers_1.onBetCreated; } });
Object.defineProperty(exports, "onMarketStatusChanged", { enumerable: true, get: function () { return triggers_1.onMarketStatusChanged; } });
Object.defineProperty(exports, "onUserCreated", { enumerable: true, get: function () { return triggers_1.onUserCreated; } });
//# sourceMappingURL=index.js.map