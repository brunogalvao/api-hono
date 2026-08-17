
-- Create expense_types table for categorization
CREATE TABLE IF NOT EXISTS expense_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE expense_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only access their own expense types
CREATE POLICY "Users can view own expense_types" ON expense_types
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expense_types" ON expense_types
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expense_types" ON expense_types
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expense_types" ON expense_types
    FOR DELETE USING (auth.uid() = user_id);

-- Index for user lookup
CREATE INDEX idx_expense_types_user ON expense_types(user_id);
;
