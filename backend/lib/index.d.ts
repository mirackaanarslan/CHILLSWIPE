import * as functions from 'firebase-functions';
export declare const api: functions.HttpsFunction;
export { processOddsCalculation, resolveExpiredMarkets, sendNotifications } from './functions/background';
export { onBetCreated, onMarketStatusChanged, onUserCreated } from './functions/triggers';
//# sourceMappingURL=index.d.ts.map