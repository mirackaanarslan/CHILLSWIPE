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
exports.sendNotifications = exports.resolveExpiredMarkets = exports.processOddsCalculation = void 0;
const functions = __importStar(require("firebase-functions"));
// Scheduled function to calculate odds every 5 minutes
exports.processOddsCalculation = functions.pubsub
    .schedule('every 5 minutes')
    .onRun(async (context) => {
    console.log('Processing odds calculation...');
    // TODO: Implement odds calculation logic
    return null;
});
// Scheduled function to resolve expired markets daily
exports.resolveExpiredMarkets = functions.pubsub
    .schedule('every 24 hours')
    .onRun(async (context) => {
    console.log('Resolving expired markets...');
    // TODO: Implement market resolution logic
    return null;
});
// Function to send notifications
exports.sendNotifications = functions.pubsub
    .schedule('every 1 hours')
    .onRun(async (context) => {
    console.log('Sending notifications...');
    // TODO: Implement notification logic
    return null;
});
//# sourceMappingURL=background.js.map