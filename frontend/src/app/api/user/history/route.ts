import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    console.log('🔍 Fetching bet history for wallet:', walletAddress);

    // First, test basic connection
    const { data: testData, error: testError } = await supabase
      .from('bets')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Supabase connection error:', testError);
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: testError.message 
      }, { status: 500 });
    }

    console.log('✅ Database connection successful');

    // Get user's bet history from database
    const { data: bets, error } = await supabase
      .from('bets')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Database query error:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch bet history',
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ Found bets for wallet:', bets?.length || 0);

    // Transform data for frontend
    const transformedBets = bets?.map(bet => ({
      id: bet.id,
      questionId: bet.question_id,
      questionTitle: 'Test Question', // We'll add questions join later
      questionDescription: 'Test Description',
      category: 'match_result',
      coin: 'PSG',
      outcome: bet.outcome,
      amount: parseFloat(bet.amount),
      status: bet.status,
      winnings: parseFloat(bet.winnings || '0'),
      marketAddress: bet.market_address || '0x...',
      createdAt: bet.created_at,
      resolvedAt: bet.resolved_at,
      endTime: bet.created_at // Temporary
    })) || [];

    return NextResponse.json({ 
      bets: transformedBets,
      total: transformedBets.length
    });

  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 