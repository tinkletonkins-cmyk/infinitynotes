

# Void Navigator: Multiverse Minimap

## Overview

A new full-screen overlay that replaces the current tab-like VoidSwitcher dropdown with an immersive "multiverse" view. When activated, the board zooms out to reveal all voids as glowing cosmic nodes in a dark space. Users click a void node to smoothly zoom into that board.

---

## User Experience

1. A new **"Map"** button appears in the bottom-left navigator (or replaces the recenter button).
2. Clicking it triggers a smooth zoom-out animation, fading the current board and revealing the **Multiverse View** -- a full-screen cosmic map.
3. Each void appears as a **circular node**:
   - Empty voids: dark purple, dim, small
   - Note-filled voids: glowing with pulsing light, size proportional to note count
   - Current void: highlighted ring
   - Public void: always visible with a globe icon
4. **Faint interconnection lines** are drawn between voids that share the same owner or members (related voids).
5. Clicking a void node triggers a smooth **zoom-in animation** that transitions into that board.
6. Pressing Escape or clicking empty space closes the navigator and returns to the current board.

---

## Technical Plan

### 1. New Component: `VoidNavigator.tsx`

A full-screen overlay using Framer Motion for animations.

**Props:**
- `isOpen: boolean`
- `onClose: () => void`
- `voids: Void[]` -- all available voids
- `currentVoidId: string | null`
- `voidNoteCounts: Record<string, number>` -- note count per void for glow intensity
- `onSelectVoid: (voidId: string | null) => void`
- `user: { id: string; email?: string } | null`

**Rendering:**
- Dark purple background (`bg-[#0a0014]`) with subtle star particles (CSS dots or canvas)
- Each void rendered as an `<motion.div>` circle positioned using a force-directed or circular layout algorithm
- Glow effect via `box-shadow` with intensity based on note count
- SVG lines between related voids (same owner)
- Public void always in center
- Labels below each node

**Animations:**
- Entry: scale from current zoom level to 0.05 with opacity fade, then reveal nodes
- Exit (selecting a void): nodes fade, zoom smoothly into selected void
- Idle: subtle floating/breathing animation on nodes using Framer Motion

### 2. New Hook: `useVoidNoteCounts.ts`

Fetches note counts for all voids the user has access to, to determine glow intensity.

```typescript
// Queries: SELECT void_id, COUNT(*) FROM notes GROUP BY void_id
// Returns: Record<string, number>
```

### 3. Modify `VoidBoard.tsx`

- Add `showNavigator` state
- Add button to trigger multiverse view (a "Map" icon in the bottom-left navigator or a dedicated button)
- Render `<VoidNavigator>` overlay
- When a void is selected in the navigator, set `currentVoidId` and close the overlay

### 4. Modify `BoardNavigator.tsx`

- Add a new "Map" button (using `Map` icon from lucide) below the recenter button, separated by a divider

### 5. CSS Additions in `index.css`

- Cosmic background with radial gradients
- Glow keyframe animations for void nodes
- Star particle effect (small dots scattered via CSS pseudo-elements or a simple canvas)

---

## Layout Algorithm

Void nodes will be arranged in a **circular layout** around a central "Public Void" node:
- Public Void in the center
- User's voids arranged in a circle around it
- Radius and spacing scale with number of voids
- Slight random offset for organic feel

---

## Visual Details

- **Empty void node**: 40px circle, `#1a0a2e` fill, dim `0.4` opacity
- **Filled void node**: 50-80px circle (scales with notes), purple-blue glow (`box-shadow: 0 0 20px #7c3aed`)
- **Current void**: white ring border
- **Connection lines**: SVG paths with `stroke: rgba(139, 92, 246, 0.15)`, dashed
- **Background**: radial gradient from deep purple center to black edges
- **Node labels**: small monospace text below each circle

---

## Files to Create
- `src/components/VoidNavigator.tsx` -- the multiverse overlay
- `src/hooks/useVoidNoteCounts.ts` -- note counts per void

## Files to Modify
- `src/components/VoidBoard.tsx` -- add state, button, and render navigator
- `src/components/BoardNavigator.tsx` -- add "Map" button
- `src/index.css` -- cosmic background styles and glow animations

