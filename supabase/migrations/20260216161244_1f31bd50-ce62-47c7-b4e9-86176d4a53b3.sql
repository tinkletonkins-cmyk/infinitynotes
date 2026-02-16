
-- Add Prime Realities columns to voids table
ALTER TABLE public.voids 
  ADD COLUMN energy_cost integer NOT NULL DEFAULT 0,
  ADD COLUMN visual_tier integer NOT NULL DEFAULT 1,
  ADD COLUMN is_prime boolean NOT NULL DEFAULT false;

-- Seed 10 Prime Reality voids
INSERT INTO public.voids (name, is_public, is_prime, visual_tier, energy_cost) VALUES
  ('Genesis',      true, true, 5, 0),
  ('Nexus',        true, true, 4, 10),
  ('Aether',       true, true, 3, 20),
  ('Prism',        true, true, 3, 25),
  ('Horizon',      true, true, 4, 15),
  ('Umbra',        true, true, 2, 30),
  ('Eclipse',      true, true, 2, 35),
  ('Drift',        true, true, 1, 40),
  ('Remnant',      true, true, 1, 50),
  ('Singularity',  true, true, 3, 45);
