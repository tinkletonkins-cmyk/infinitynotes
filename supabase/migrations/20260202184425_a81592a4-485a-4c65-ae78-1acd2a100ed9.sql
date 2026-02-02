-- Add is_locked column to notes table
ALTER TABLE public.notes 
ADD COLUMN is_locked boolean NOT NULL DEFAULT false;

-- Add locked_by column to track who locked it
ALTER TABLE public.notes 
ADD COLUMN locked_by text DEFAULT NULL;