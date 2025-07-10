import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { questionId, outcome, amount, wallet } = await request.json();

    // Validate required fields
    if (!questionId || !outcome || !amount || !wallet) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // For now, just return success without saving to database
    // We'll implement bet saving later when the table is ready
    return NextResponse.json({
      success: true,
      bet: {
        id: 'temp-' + Date.now(),
        question_id: questionId,
        wallet_address: wallet,
        outcome: outcome,
        amount: amount,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Error in bets API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 