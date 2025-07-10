-- Complete setup for questions table with category support

-- Create questions table if it doesn't exist
CREATE TABLE IF NOT EXISTS questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'match_result',
    image_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add category column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'questions' AND column_name = 'category') THEN
        ALTER TABLE questions ADD COLUMN category TEXT DEFAULT 'match_result';
    END IF;
END $$;

-- Update existing questions to have a default category
UPDATE questions 
SET category = 'match_result' 
WHERE category IS NULL;

-- Make category column NOT NULL after setting default values
ALTER TABLE questions 
ALTER COLUMN category SET NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;
CREATE TRIGGER update_questions_updated_at 
    BEFORE UPDATE ON questions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access" ON questions
    FOR SELECT USING (true);

-- Create policy for authenticated users to insert
CREATE POLICY "Allow authenticated insert" ON questions
    FOR INSERT WITH CHECK (true);

-- Create policy for authenticated users to update
CREATE POLICY "Allow authenticated update" ON questions
    FOR UPDATE USING (true);

-- Create policy for authenticated users to delete
CREATE POLICY "Allow authenticated delete" ON questions
    FOR DELETE USING (true); 