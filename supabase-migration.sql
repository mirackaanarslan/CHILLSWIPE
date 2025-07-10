-- Add category column to questions table
ALTER TABLE questions 
ADD COLUMN category TEXT DEFAULT 'match_result';

-- Update existing questions to have a default category
UPDATE questions 
SET category = 'match_result' 
WHERE category IS NULL;

-- Make category column NOT NULL after setting default values
ALTER TABLE questions 
ALTER COLUMN category SET NOT NULL;

-- Add index for better performance on category queries
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category); 