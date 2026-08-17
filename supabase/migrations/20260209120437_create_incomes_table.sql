
-- Create incomes table for income tracking
CREATE TABLE IF NOT EXISTS incomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    descricao TEXT,
    valor NUMERIC NOT NULL DEFAULT 0,
    mes INTEGER NOT NULL,
    ano INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only access their own incomes
CREATE POLICY "Users can view own incomes" ON incomes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own incomes" ON incomes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own incomes" ON incomes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own incomes" ON incomes
    FOR DELETE USING (auth.uid() = user_id);

-- Index for common query pattern
CREATE INDEX idx_incomes_user_month_year ON incomes(user_id, mes, ano);
;
