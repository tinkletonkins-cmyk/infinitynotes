ALTER TABLE public.voids
ADD COLUMN IF NOT EXISTS board_type text NOT NULL DEFAULT 'cosmic';

CREATE INDEX IF NOT EXISTS voids_board_type_idx ON public.voids(board_type);