-- Create table to store Google service account credentials
CREATE TABLE IF NOT EXISTS google_service_account (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credentials JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS (Row Level Security)
ALTER TABLE google_service_account ENABLE ROW LEVEL SECURITY;

-- Create policy that allows read access (for the edge function)
-- Note: In production, you may want to restrict this further
CREATE POLICY "Allow service role to read credentials" 
ON google_service_account
FOR SELECT
TO service_role
USING (true);

-- Create policy for admin updates
CREATE POLICY "Allow authenticated users to update credentials"
ON google_service_account
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_google_service_account_id ON google_service_account(id);

-- Insert a placeholder row (you'll update this with actual credentials)
INSERT INTO google_service_account (credentials) 
VALUES ('{"client_email": "your-service-account@project.iam.gserviceaccount.com", "private_key": "YOUR_PRIVATE_KEY_HERE"}'::jsonb)
ON CONFLICT DO NOTHING;
