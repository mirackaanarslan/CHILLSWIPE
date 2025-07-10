import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Initialize Firebase Admin
admin.initializeApp();

// Import route handlers
import { questionsRouter } from './routes/questions';
import { marketsRouter } from './routes/markets';
import { betsRouter } from './routes/bets';
import { usersRouter } from './routes/users';

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/questions', questionsRouter);
app.use('/markets', marketsRouter);
app.use('/bets', betsRouter);
app.use('/users', usersRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'prediction-market-api'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Export the main API function
export const api = functions.https.onRequest(app);

// Background functions for automation
export { 
  processOddsCalculation,
  resolveExpiredMarkets,
  sendNotifications
} from './functions/background';

// Firestore triggers
export {
  onBetCreated,
  onMarketStatusChanged,
  onUserCreated
} from './functions/triggers'; 