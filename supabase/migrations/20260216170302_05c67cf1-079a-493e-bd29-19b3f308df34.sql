
-- Equipment catalog (static, public read)
CREATE TABLE public.equipment_catalog (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  icon text NOT NULL,
  energy_cost integer NOT NULL,
  tier integer NOT NULL DEFAULT 1,
  effect_key text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.equipment_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view equipment catalog"
  ON public.equipment_catalog FOR SELECT
  USING (true);

-- Player equipment (owned items)
CREATE TABLE public.player_equipment (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  equipment_id uuid NOT NULL REFERENCES public.equipment_catalog(id) ON DELETE CASCADE,
  void_id uuid REFERENCES public.voids(id) ON DELETE SET NULL,
  purchased_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

ALTER TABLE public.player_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own equipment"
  ON public.player_equipment FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can purchase equipment"
  ON public.player_equipment FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own equipment"
  ON public.player_equipment FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own equipment"
  ON public.player_equipment FOR DELETE
  USING (auth.uid() = user_id);

-- Player energy (balance tracker)
CREATE TABLE public.player_energy (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  balance integer NOT NULL DEFAULT 500,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.player_energy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own energy"
  ON public.player_energy FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own energy"
  ON public.player_energy FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own energy"
  ON public.player_energy FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- DB function to ensure player energy row exists
CREATE OR REPLACE FUNCTION public.ensure_player_energy()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_balance integer;
BEGIN
  SELECT balance INTO current_balance FROM player_energy WHERE user_id = auth.uid();
  IF NOT FOUND THEN
    INSERT INTO player_energy (user_id, balance) VALUES (auth.uid(), 500);
    RETURN 500;
  END IF;
  RETURN current_balance;
END;
$$;

-- Seed the 12 equipment items
INSERT INTO public.equipment_catalog (name, description, category, icon, energy_cost, tier, effect_key) VALUES
  ('Resonance Lens', 'Auto-suggest related notes based on content similarity', 'link', 'scan-eye', 120, 2, 'resonance_lens'),
  ('Thread Weaver', 'Shows faint connection lines between semantically related notes', 'link', 'cable', 80, 1, 'thread_weaver'),
  ('Gravity Anchor', 'Pulls related notes closer together over time', 'link', 'anchor', 200, 3, 'gravity_anchor'),
  ('Void Compass', 'Minimap radar showing note distribution', 'navigation', 'compass', 100, 1, 'void_compass'),
  ('Warp Jump', 'Fast zoom travel to any note cluster', 'navigation', 'rocket', 150, 2, 'warp_jump'),
  ('Cluster Beacon', 'Highlights topic groups with colored halos', 'navigation', 'radar', 250, 3, 'cluster_beacon'),
  ('Memory Grid', 'Snap notes into organized grid clusters', 'organization', 'layout-grid', 90, 1, 'memory_grid'),
  ('Echo Archive', 'Timeline playback of note evolution', 'organization', 'archive', 160, 2, 'echo_archive'),
  ('Tag Engine', 'Auto-categorize notes with intelligent tags', 'organization', 'tags', 220, 3, 'tag_engine'),
  ('Aura Field', 'Glow themes that respond to note mood', 'expression', 'sun', 80, 1, 'aura_field'),
  ('Nebula Skin', 'Dynamic background moods for your void', 'expression', 'cloud', 140, 2, 'nebula_skin'),
  ('Signature Border', 'Personal void mark — your cosmic fingerprint', 'expression', 'fingerprint', 300, 3, 'signature_border');
