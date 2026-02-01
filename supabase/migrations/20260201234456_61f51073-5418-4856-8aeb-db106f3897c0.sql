-- Create a table for note connections
CREATE TABLE public.note_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  to_note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(from_note_id, to_note_id)
);

-- Enable realtime for connections
ALTER PUBLICATION supabase_realtime ADD TABLE public.note_connections;

-- Allow all operations since this is a public board (no auth)
ALTER TABLE public.note_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to note_connections"
ON public.note_connections
FOR ALL
USING (true)
WITH CHECK (true);