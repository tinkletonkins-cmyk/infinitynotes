import { useMemo } from 'react';
import { useEquipmentUnified } from './useEquipmentUnified';

/**
 * Returns a Set of active effect_keys for the current void.
 * Equipment must be owned AND installed in the current void to be active.
 * Works for both logged-in and guest users.
 * Uses '__default__' as a fallback key when no named void is selected.
 */
export function useActiveEffects(userId: string | null, currentVoidId: string | null) {
  // Resolve the effective void key — '__default__' lets guests activate equipment
  // on the main board without needing a named void
  const effectiveVoidId = currentVoidId ?? '__default__';
  const { owned, catalog } = useEquipmentUnified(userId, effectiveVoidId);

  const activeEffects = useMemo(() => {
    const effects = new Set<string>();

    for (const oe of owned) {
      if (oe.void_id === effectiveVoidId) {
        const item = catalog.find(c => c.id === oe.equipment_id);
        if (item) {
          effects.add(item.effect_key);
        }
      }
    }
    return effects;
  }, [owned, catalog, effectiveVoidId]);

  return activeEffects;
}
