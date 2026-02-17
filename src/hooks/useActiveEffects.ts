import { useMemo } from 'react';
import { useEquipment } from './useEquipment';

/**
 * Returns a Set of active effect_keys for the current void.
 * Equipment must be owned AND installed in the current void to be active.
 */
export function useActiveEffects(userId: string | null, currentVoidId: string | null) {
  const { owned, catalog } = useEquipment(userId, currentVoidId);

  const activeEffects = useMemo(() => {
    const effects = new Set<string>();
    if (!currentVoidId) return effects;

    for (const oe of owned) {
      if (oe.void_id === currentVoidId) {
        const item = catalog.find(c => c.id === oe.equipment_id);
        if (item) {
          effects.add(item.effect_key);
        }
      }
    }
    return effects;
  }, [owned, catalog, currentVoidId]);

  return activeEffects;
}
