
# Multiverse Navigator Overhaul: Cosmic Debris, Portal Voids, and Prime Realities

## Overview

Three interconnected enhancements to the Void Navigator that transform it from a simple node map into a living cosmic space. Flying sticky note debris drifts through the void, each void becomes a swirling purple portal, and 10 "Prime Reality" voids form the backbone constellation of the multiverse.

---

## 1. Flying Sticky Notes (Cosmic Debris)

Non-interactive sticky note silhouettes that drift through the navigator space, giving it a lived-in feel.

- 15-20 small rectangular shapes (~35x22px) with slight border-radius
- Three parallax depth layers (far/mid/near) with different speeds, sizes, and opacities (0.04-0.12)
- Slow orbital drift using framer-motion keyframe animations (20-40s loops)
- Random gentle rotation as they float
- Muted purple/violet/indigo tones
- `pointer-events: none` so they never block interaction
- Generated with `useMemo` for stable positions across re-renders

---

## 2. Purple Portal Voids

Replace the current flat circle nodes with animated swirling portals.

**Unlocked voids (user has access):**
- Glowing purple ring with rotating border animation (CSS `conic-gradient` trick)
- Animated vortex center using layered radial gradients with rotation
- Faint energy spark particles orbiting the ring
- Slow continuous rotation (~20s per revolution)
- Pulse every 3-5 seconds (scale 1 to 1.08)
- Bright, stable, inviting glow

**Locked voids (private, not owned by user):**
- Darker purple tones, reduced opacity
- "Cracked" energy shell -- broken dashed ring border
- Faint flicker animation (opacity jitter)
- Lock glyph (`Lock` icon from lucide) overlaid at center
- No vortex animation, just a dim static interior

**Status readable from color at a glance:**
- Bright purple + glow = unlocked, active
- Dark purple + flicker = locked
- White ring = current void

---

## 3. Prime Realities System

10 predefined "backbone" voids arranged in a fixed constellation layout with specific interconnection lines.

**Database changes -- add columns to `voids` table:**
- `energy_cost` (integer, default 0) -- visual tier indicator
- `visual_tier` (integer, default 1, range 1-5) -- controls portal size/glow intensity
- `is_prime` (boolean, default false) -- marks Prime Reality voids

**Constellation layout:**
The 10 Prime Reality voids use fixed positions in a hardcoded constellation pattern matching the user's diagram:

```text
      Void 3 ---- Void 4
     /                  \
Void 1 ---- Void 2 ---- Void 5
     \                  /
      Void 6 ---- Void 7
           |
        Void 8
           |
        Void 9 ---- Void 10
```

Non-prime voids float in the outer area using the existing circular layout. Prime voids are rendered larger and more prominently.

**Connection lines:**
- All voids interconnected with dotted SVG lines (as shown in diagram)
- Prime-to-prime connections are brighter (opacity 0.25 vs 0.15)
- Non-prime voids connect to their nearest prime void with dimmer lines

**Each Prime Reality displays:**
- Name label below
- Visual tier indicator (ring thickness/glow intensity scales with tier)
- Energy cost as a small badge
- Lock/unlock state via the portal visual style

---

## Technical Details

### Files to Modify

**`src/components/VoidNavigator.tsx`** (major rewrite):
- Add `CosmicDebris` internal component for flying sticky notes
- Replace flat circle nodes with `PortalNode` internal component
- Add constellation layout logic for prime voids
- Add lock/unlock visual distinction based on `is_public` and `owner_id` matching current user
- Render all voids interconnected with dotted lines (not just same-owner)

**`src/index.css`**:
- Add `@keyframes portalSpin` for rotating vortex effect
- Add `@keyframes portalPulse` for periodic pulse
- Add `@keyframes flickerLocked` for locked void flicker

**Database migration**:
- Add `energy_cost`, `visual_tier`, `is_prime` columns to `voids` table
- Seed 10 Prime Reality voids with predefined names and constellation metadata

### Lock State Logic

A void is considered **locked** if:
- `is_public` is false AND `owner_id` does not match the current user's ID AND the user is not a member

A void is considered **unlocked** if:
- `is_public` is true, OR `owner_id` matches current user, OR user is a void member

This uses the same access logic already present in the app.

### Layout Algorithm Update

1. Prime voids get fixed pixel positions based on the constellation diagram, centered on screen
2. Non-prime voids are arranged in an outer ring beyond the constellation
3. All voids are interconnected with dotted lines
4. The public void remains at center if no prime voids exist

### New Props for VoidNavigator

The existing props are sufficient. The component will:
- Derive lock state from `void.is_public`, `void.owner_id`, and `user.id`
- Read `visual_tier`, `energy_cost`, `is_prime` from the void data (new DB columns)
- Use `voidNoteCounts` for additional glow intensity on active portals
