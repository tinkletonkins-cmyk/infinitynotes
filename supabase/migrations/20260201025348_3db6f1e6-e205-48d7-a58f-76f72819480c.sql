-- Create notes table for persisting board state
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL DEFAULT '',
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  rotation FLOAT NOT NULL DEFAULT 0,
  parent_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create note_messages table for multiplayer chat on each note
CREATE TABLE public.note_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  username TEXT NOT NULL DEFAULT 'anon',
  content TEXT NOT NULL,
  is_ai BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security with public access (anonymous multiplayer)
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_messages ENABLE ROW LEVEL SECURITY;

-- Public read/write policies for anonymous access
CREATE POLICY "Anyone can view notes" ON public.notes FOR SELECT USING (true);
CREATE POLICY "Anyone can create notes" ON public.notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update notes" ON public.notes FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete notes" ON public.notes FOR DELETE USING (true);

CREATE POLICY "Anyone can view messages" ON public.note_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can send messages" ON public.note_messages FOR INSERT WITH CHECK (true);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.note_messages;