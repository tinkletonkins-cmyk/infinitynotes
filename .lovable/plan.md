
# Equipment Shop -- Cosmic Console Panel

## Overview

A full-screen floating panel that matches the existing Void Navigator aesthetic (deep purple cosmos, soft glow edges, `font-mono` uppercase tracking). The shop displays 12 equipment items across 4 category tabs, with tier-based glow styling. Players spend energy to acquire modules and install them into voids.

---

## Database Changes (Migration)

Three new tables with RLS:

**`equipment_catalog`** (12 seeded rows, public read):
- `id` (uuid PK), `name`, `description`, `category` (link/navigation/organization/expression), `icon` (lucide icon name), `energy_cost` (int), `tier` (1-3), `effect_key` (text unique), `created_at`
- RLS: SELECT for all (anon + authenticated)

**`player_equipment`** (user purchases):
- `id` (uuid PK), `user_id` (uuid NOT NULL), `equipment_id` (uuid FK), `void_id` (uuid FK nullable), `purchased_at`, `is_active` (bool default true)
- RLS: authenticated users SELECT/INSERT/UPDATE/DELETE own rows only (`user_id = auth.uid()`)

**`player_energy`** (balance tracker):
- `id` (uuid PK), `user_id` (uuid NOT NULL unique), `balance` (int default 500), `updated_at`
- RLS: authenticated users SELECT/UPDATE own row only
- Auto-create row on first interaction via a DB function `ensure_player_energy()`

Seed the 12 equipment items:
- Link: Resonance Lens (120, T2), Thread Weaver (80, T1), Gravity Anchor (200, T3)
- Navigation: Void Compass (100, T1), Warp Jump (150, T2), Cluster Beacon (250, T3)
- Organization: Memory Grid (90, T1), Echo Archive (160, T2), Tag Engine (220, T3)
- Expression: Aura Field (80, T1), Nebula Skin (140, T2), Signature Border (300, T3)

---

## New Files

### `src/hooks/useEquipment.ts`
- Fetches `equipment_catalog` (all items)
- Fetches `player_equipment` for current user (owned items)
- Fetches/ensures `player_energy` balance
- `purchaseEquipment(equipmentId)`: checks balance, deducts energy via update, inserts into `player_equipment`
- `installEquipment(equipmentId, voidId)`: sets `void_id` on owned equipment
- `uninstallEquipment(equipmentId)`: clears `void_id`
- Uses `@tanstack/react-query` for caching and invalidation (matches existing hooks pattern)

### `src/components/EquipmentShop.tsx`
Full-screen overlay matching `VoidNavigator` pattern:
- `AnimatePresence` + `motion.div` with `fixed inset-0 z-[200]`
- Same deep purple cosmic background as navigator (`void-navigator-bg` class)
- Central floating panel (max-w-2xl) with border styling matching `VoidSummaryModal` (border-2 border-foreground bg-background)

**Layout:**
- Header: "Equipment Bay" title (xs uppercase tracking-[0.5em] text-purple-300/60 font-mono) + energy balance badge (top-right, Zap icon + count)
- Category tabs using the existing `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` components, styled with purple active states
- Grid of equipment cards (2 columns)

**Equipment card design:**
- Dark card with border (border border-foreground/20)
- Lucide icon rendered dynamically from the `icon` field
- Name (uppercase tracking-wider), description (text-xs muted)
- Tier indicator: 1-3 small star dots
- Energy cost badge (Zap icon + number)
- Tier 1: subtle border only
- Tier 2: `box-shadow: 0 0 12px hsl(270 60% 40% / 0.3)` purple glow
- Tier 3: animated gold-purple glow border (CSS animation in index.css)
- "Acquire" button (btn-brutalist style) or "Owned" badge if already purchased
- Disabled state if insufficient energy

**Inventory section (bottom of panel or separate tab):**
- Lists owned equipment with install/uninstall toggle per item
- Shows which void each item is installed in

### `src/components/EquipmentInventory.tsx`
A sub-component rendered inside the shop showing owned items with:
- Active/inactive toggle
- "Install to current void" / "Uninstall" actions
- Glow highlight on active items

---

## Modified Files

### `src/components/VoidBoard.tsx`
- Import `EquipmentShop`
- Add `showEquipmentShop` state
- Add toolbar button (Wrench icon from lucide) in the right sidebar stack (below the existing "Connect" button at ~line 668), following the exact same button pattern:
  ```
  fixed top-[calc] right-4 z-50 flex items-center gap-2 px-3 py-2 border border-foreground bg-background hover:bg-foreground hover:text-background transition-colors
  ```
- Text label: "EQUIP"
- If user not logged in, opens AuthModal instead
- Render `<EquipmentShop>` alongside other modals, passing `user`, `currentVoidId`

### `src/index.css`
Add tier-3 animated glow keyframe:
```css
.equipment-tier-3 {
  animation: tier3Glow 3s ease-in-out infinite;
}

@keyframes tier3Glow {
  0%, 100% { box-shadow: 0 0 8px hsl(45 90% 55% / 0.3), 0 0 20px hsl(270 60% 40% / 0.2); }
  50% { box-shadow: 0 0 16px hsl(45 90% 55% / 0.5), 0 0 30px hsl(270 60% 40% / 0.4); }
}
```

---

## Visual Language Alignment

Every element reuses existing patterns:
- **Background**: `void-navigator-bg` class (radial purple-to-black gradient with star particles)
- **Panel**: `border-2 border-foreground bg-background` (same as VoidSummaryModal)
- **Typography**: `font-mono uppercase tracking-[0.3em]` headers, `text-xs text-muted-foreground` descriptions
- **Buttons**: `btn-brutalist` class for purchase actions
- **Colors**: Purple-300/60 for labels, foreground/background for high contrast elements
- **Animations**: `framer-motion` for entry/exit (same duration/easing as navigator)
- **Close**: X button top-right, Esc key handler (same pattern as all modals)
- **Icons**: lucide-react throughout (Zap for energy, Wrench for shop trigger)

---

## Technical Notes

- The `ensure_player_energy` DB function creates the player's energy row on first purchase if it doesn't exist, avoiding race conditions
- Equipment catalog is read-only for users -- no write RLS policies
- Purchase is a sequential check-then-deduct flow (acceptable for single-player energy)
- The `effect_key` column enables future gameplay hooks without schema changes
- Dynamic icon rendering uses a lookup map from string to lucide component (e.g., `{ 'eye': Eye, 'link': Link2, ... }`)
