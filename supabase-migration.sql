-- Update existing questions to PSG
UPDATE questions SET coin = 'PSG' WHERE coin IS NULL;

-- Make coin column NOT NULL after setting default values
ALTER TABLE questions ALTER COLUMN coin SET NOT NULL;

-- Add index for coin column
CREATE INDEX IF NOT EXISTS idx_questions_coin ON questions(coin);

-- Add end_time column to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE;

-- Create markets table
CREATE TABLE IF NOT EXISTS markets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    bet_id UUID REFERENCES bets(id) ON DELETE CASCADE,
    token_address TEXT NOT NULL,
    token_symbol TEXT NOT NULL CHECK (token_symbol IN ('PSG', 'BAR')),
    market_address TEXT,
    creator_address TEXT NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    outcome INTEGER DEFAULT 0, -- 0: not resolved, 1: YES, 2: NO
    total_yes DECIMAL(20, 18) DEFAULT 0,
    total_no DECIMAL(20, 18) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_markets_question_id ON markets(question_id);
CREATE INDEX IF NOT EXISTS idx_markets_creator ON markets(creator_address);
CREATE INDEX IF NOT EXISTS idx_markets_resolved ON markets(resolved);
CREATE INDEX IF NOT EXISTS idx_markets_end_time ON markets(end_time);

-- Add trigger to update updated_at (only if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists, then create it
DROP TRIGGER IF EXISTS update_markets_updated_at ON markets;
CREATE TRIGGER update_markets_updated_at 
    BEFORE UPDATE ON markets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add market_address column to bets table if it doesn't exist
ALTER TABLE bets ADD COLUMN IF NOT EXISTS market_address TEXT;

-- Add transaction_hash column to bets table if it doesn't exist
ALTER TABLE bets ADD COLUMN IF NOT EXISTS transaction_hash TEXT;

-- Add coin column to bets table if it doesn't exist
ALTER TABLE bets ADD COLUMN IF NOT EXISTS coin TEXT DEFAULT 'PSG';

-- Add indexes for bets table
CREATE INDEX IF NOT EXISTS idx_bets_question_id ON bets(question_id);
CREATE INDEX IF NOT EXISTS idx_bets_wallet_address ON bets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_bets_status ON bets(status);
CREATE INDEX IF NOT EXISTS idx_bets_market_address ON bets(market_address);
CREATE INDEX IF NOT EXISTS idx_bets_transaction_hash ON bets(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_bets_coin ON bets(coin);

-- Remove unnecessary bet_id column from markets table
ALTER TABLE markets DROP COLUMN IF EXISTS bet_id;

-- Drop question_markets table if it exists (redundant with markets table)
DROP TABLE IF EXISTS question_markets;

-- Clear all data for testing (BE CAREFUL - this deletes everything!)
-- TRUNCATE TABLE bets CASCADE;
-- TRUNCATE TABLE markets CASCADE;
-- TRUNCATE TABLE questions CASCADE;
-- TRUNCATE TABLE users CASCADE;

-- Simplify users table - remove unnecessary columns
ALTER TABLE users DROP COLUMN IF EXISTS username;
ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;
ALTER TABLE users DROP COLUMN IF EXISTS bio;
ALTER TABLE users DROP COLUMN IF EXISTS is_verified;
ALTER TABLE users DROP COLUMN IF EXISTS role;

-- Add is_premium column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

-- Add resolved_at column to bets table for tracking when bets are resolved/claimed
ALTER TABLE bets ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;

-- Update existing bets to link with markets
-- This will be handled by the application logic 