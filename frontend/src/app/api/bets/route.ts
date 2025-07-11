import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('API received request body:', body);
    
    const { questionId, outcome, amount, wallet } = body;

    console.log('Extracted fields:', {
      questionId: questionId,
      outcome: outcome,
      amount: amount,
      wallet: wallet
    });

    // Validate required fields
    if (!questionId || !outcome || !amount || !wallet) {
      console.log('Missing fields detected:', {
        hasQuestionId: !!questionId,
        hasOutcome: !!outcome,
        hasAmount: !!amount,
        hasWallet: !!wallet
      });
      
      return NextResponse.json(
        { error: 'Missing required fields', received: body },
        { status: 400 }
      );
    }

    // For now, just return success without saving to database
    // We'll implement bet saving later when the table is ready
    const response = {
      success: true,
      bet: {
        id: 'temp-' + Date.now(),
        question_id: questionId,
        wallet_address: wallet,
        outcome: outcome,
        amount: amount,
        status: 'pending'
      }
    };
    
    console.log('API returning success:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in bets API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 