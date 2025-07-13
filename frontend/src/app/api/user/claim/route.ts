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

    console.log('🔍 Fetching claimable amount for wallet:', walletAddress);

    // Test basic connection first
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

    // Get user's claimable bets
    const { data: claimableBets, error } = await supabase
      .from('bets')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .eq('status', 'won')
      .gt('winnings', 0);

    if (error) {
      console.error('❌ Database query error:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch claimable bets',
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ Found claimable bets:', claimableBets?.length || 0);

    const totalClaimable = claimableBets?.reduce((sum, bet) => sum + parseFloat(bet.winnings || '0'), 0) || 0;

    return NextResponse.json({ 
      claimableAmount: totalClaimable,
      claimableBets: claimableBets?.length || 0
    });

  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, betIds } = body;

    if (!walletAddress || !betIds || !Array.isArray(betIds)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    console.log('🔍 Processing claim for wallet:', walletAddress, 'bets:', betIds);

    // Update bet status to claimed
    const { error: updateError } = await supabase
      .from('bets')
      .update({ 
        status: 'claimed',
        resolved_at: new Date().toISOString()
      })
      .eq('wallet_address', walletAddress.toLowerCase())
      .in('id', betIds)
      .eq('status', 'won');

    if (updateError) {
      console.error('❌ Database update error:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update bet status',
        details: updateError.message 
      }, { status: 500 });
    }

    // Get total claimed amount
    const { data: claimedBets, error: fetchError } = await supabase
      .from('bets')
      .select('winnings')
      .eq('wallet_address', walletAddress.toLowerCase())
      .in('id', betIds);

    if (fetchError) {
      console.error('❌ Database fetch error:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch claimed amount',
        details: fetchError.message 
      }, { status: 500 });
    }

    const totalClaimed = claimedBets?.reduce((sum, bet) => sum + parseFloat(bet.winnings || '0'), 0) || 0;

    return NextResponse.json({ 
      success: true,
      claimedAmount: totalClaimed,
      claimedBets: betIds.length
    });

  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 