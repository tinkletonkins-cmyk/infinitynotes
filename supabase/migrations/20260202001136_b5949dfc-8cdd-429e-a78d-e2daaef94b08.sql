-- Create voids table for private boards
CREATE TABLE public.voids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'My Void',
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN NOT NULL DEFAULT false,
  invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create void_members table for invitations
CREATE TABLE public.void_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  void_id UUID NOT NULL REFERENCES public.voids(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(void_id, user_id)
);

-- Add void_id to notes (nullable for the public void)
ALTER TABLE public.notes ADD COLUMN void_id UUID REFERENCES public.voids(id) ON DELETE CASCADE;

-- Add void_id to note_connections 
ALTER TABLE public.note_connections ADD COLUMN void_id UUID REFERENCES public.voids(id) ON DELETE CASCADE;

-- Enable RLS on new tables
ALTER TABLE public.voids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.void_members ENABLE ROW LEVEL SECURITY;

-- Voids policies
-- Anyone can view public voids, members can view their voids
CREATE POLICY "Anyone can view public voids" ON public.voids
  FOR SELECT USING (is_public = true OR owner_id = auth.uid() OR id IN (
    SELECT void_id FROM public.void_members WHERE user_id = auth.uid()
  ));

-- Authenticated users can create voids
CREATE POLICY "Authenticated users can create voids" ON public.voids
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

-- Owners can update their voids
CREATE POLICY "Owners can update their voids" ON public.voids
  FOR UPDATE USING (owner_id = auth.uid());

-- Owners can delete their voids
CREATE POLICY "Owners can delete their voids" ON public.voids
  FOR DELETE USING (owner_id = auth.uid());

-- Void members policies
CREATE POLICY "Members can view void membership" ON public.void_members
  FOR SELECT USING (
    user_id = auth.uid() OR 
    void_id IN (SELECT id FROM public.voids WHERE owner_id = auth.uid())
  );

CREATE POLICY "Owners can add members" ON public.void_members
  FOR INSERT TO authenticated WITH CHECK (
    void_id IN (SELECT id FROM public.voids WHERE owner_id = auth.uid())
  );

CREATE POLICY "Owners can remove members" ON public.void_members
  FOR DELETE USING (
    void_id IN (SELECT id FROM public.voids WHERE owner_id = auth.uid()) OR user_id = auth.uid()
  );

-- Update notes policies to support voids
DROP POLICY IF EXISTS "Anyone can view notes" ON public.notes;
DROP POLICY IF EXISTS "Anyone can create notes" ON public.notes;
DROP POLICY IF EXISTS "Anyone can update notes" ON public.notes;
DROP POLICY IF EXISTS "Anyone can delete notes" ON public.notes;

-- Notes in public void (void_id IS NULL) are accessible to everyone
-- Notes in private voids are only accessible to members
CREATE POLICY "View notes in accessible voids" ON public.notes
  FOR SELECT USING (
    void_id IS NULL OR 
    void_id IN (SELECT id FROM public.voids WHERE owner_id = auth.uid()) OR
    void_id IN (SELECT void_id FROM public.void_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Create notes in accessible voids" ON public.notes
  FOR INSERT WITH CHECK (
    void_id IS NULL OR 
    void_id IN (SELECT id FROM public.voids WHERE owner_id = auth.uid()) OR
    void_id IN (SELECT void_id FROM public.void_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Update notes in accessible voids" ON public.notes
  FOR UPDATE USING (
    void_id IS NULL OR 
    void_id IN (SELECT id FROM public.voids WHERE owner_id = auth.uid()) OR
    void_id IN (SELECT void_id FROM public.void_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Delete notes in accessible voids" ON public.notes
  FOR DELETE USING (
    void_id IS NULL OR 
    void_id IN (SELECT id FROM public.voids WHERE owner_id = auth.uid()) OR
    void_id IN (SELECT void_id FROM public.void_members WHERE user_id = auth.uid())
  );

-- Update note_connections policies
DROP POLICY IF EXISTS "Allow all access to note_connections" ON public.note_connections;

CREATE POLICY "View connections in accessible voids" ON public.note_connections
  FOR SELECT USING (
    void_id IS NULL OR 
    void_id IN (SELECT id FROM public.voids WHERE owner_id = auth.uid()) OR
    void_id IN (SELECT void_id FROM public.void_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Create connections in accessible voids" ON public.note_connections
  FOR INSERT WITH CHECK (
    void_id IS NULL OR 
    void_id IN (SELECT id FROM public.voids WHERE owner_id = auth.uid()) OR
    void_id IN (SELECT void_id FROM public.void_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Delete connections in accessible voids" ON public.note_connections
  FOR DELETE USING (
    void_id IS NULL OR 
    void_id IN (SELECT id FROM public.voids WHERE owner_id = auth.uid()) OR
    void_id IN (SELECT void_id FROM public.void_members WHERE user_id = auth.uid())
  );

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.voids;
ALTER PUBLICATION supabase_realtime ADD TABLE public.void_members;