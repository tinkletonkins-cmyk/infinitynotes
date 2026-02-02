-- Add shape column to notes table for note shapes
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS shape text DEFAULT 'square';