

## Delete the Multiverse Navigator

Remove the Multiverse Navigator feature entirely — the full-screen cosmic portal map, its supporting components, and all references.

### Files to delete
- `src/components/VoidNavigator.tsx`
- `src/components/navigator/CosmicDebris.tsx`
- `src/components/navigator/PortalNode.tsx`
- `src/hooks/useVoidNoteCounts.ts`

### Files to edit

**`src/components/VoidBoard.tsx`**
- Remove imports: `VoidNavigator`, `useVoidNoteCounts`
- Remove state: `showNavigator`
- Remove memo: `voidIds`, `voidNoteCounts`
- Remove the `<VoidNavigator ... />` JSX block
- Remove `onOpenNavigator` prop from `<BoardNavigator />`

**`src/components/BoardNavigator.tsx`**
- Remove the `Map` icon import
- Remove `onOpenNavigator` from the props interface
- Remove the Map button and its separator at the bottom of the component

