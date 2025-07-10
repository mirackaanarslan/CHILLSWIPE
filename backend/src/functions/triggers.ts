import * as functions from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

// Trigger when a new bet is created
export const onBetCreated = functions.firestore
  .document('bets/{betId}')
  .onCreate(async (snap, context) => {
    console.log('New bet created:', context.params.betId);
    
    // TODO: Update question statistics
    // TODO: Recalculate odds
    // TODO: Update user balance
    
    return null;
  });

// Trigger when market status changes
export const onMarketStatusChanged = functions.firestore
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
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
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