-- Add status tracking columns to lead_qualifications
ALTER TABLE lead_qualifications
ADD COLUMN IF NOT EXISTS linkedin_url text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'À contacter',
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_by text;
