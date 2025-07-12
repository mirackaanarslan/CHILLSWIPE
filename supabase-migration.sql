-- Add coin column to questions table
ALTER TABLE questions ADD COLUMN coin TEXT DEFAULT 'PSG' CHECK (coin IN ('PSG', 'BAR'));

-- Update existing questions to PSG
UPDATE questions SET coin = 'PSG' WHERE coin IS NULL;

-- Make coin column NOT NULL after setting default values
ALTER TABLE questions ALTER COLUMN coin SET NOT NULL;

-- Add index for coin column
CREATE INDEX idx_questions_coin ON questions(coin); 