-- Add color column to notes table for manual color override
ALTER TABLE public.notes ADD COLUMN color text DEFAULT NULL;