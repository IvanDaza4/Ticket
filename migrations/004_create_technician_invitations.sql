-- Create technician_invitations table
CREATE TABLE IF NOT EXISTS technician_invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email varchar NOT NULL,
  token varchar NOT NULL UNIQUE,
  status varchar DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  invited_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  accepted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT valid_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Create index for faster token lookups
CREATE INDEX idx_technician_invitations_token ON technician_invitations(token);
CREATE INDEX idx_technician_invitations_email ON technician_invitations(email);
CREATE INDEX idx_technician_invitations_status ON technician_invitations(status);

-- Add RLS policies
ALTER TABLE technician_invitations ENABLE ROW LEVEL SECURITY;

-- Only admins can create invitations
CREATE POLICY "Admins can create technician invitations" ON technician_invitations
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Only admins can view all invitations
CREATE POLICY "Admins can view technician invitations" ON technician_invitations
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Anonymous users can update their own invitation status when accepting
CREATE POLICY "Anyone can accept technician invitations" ON technician_invitations
  FOR UPDATE USING (status = 'pending') 
  WITH CHECK (status IN ('accepted', 'expired', 'revoked'));
