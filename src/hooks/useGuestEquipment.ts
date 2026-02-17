import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EquipmentItem, OwnedEquipment } from './useEquipment';

const GUEST_INVENTORY_KEY = 'void-guest-equipment';
const GUEST_ENERGY_KEY = 'void-guest-energy';
const DEFAULT_ENERGY = 500;

interface GuestInventoryItem {
  id: string;
  equipment_id: string;
  void_id: string | null;
  purchased_at: string;
}

function loadGuestInventory(): GuestInventoryItem[] {
  try {
    const raw = localStorage.getItem(GUEST_INVENTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGuestInventory(items: GuestInventoryItem[]) {
  localStorage.setItem(GUEST_INVENTORY_KEY, JSON.stringify(items));
}

function loadGuestEnergy(): number {
  try {
    const raw = localStorage.getItem(GUEST_ENERGY_KEY);
    return raw ? Number(raw) : DEFAULT_ENERGY;
  } catch {
    return DEFAULT_ENERGY;
  }
}

function saveGuestEnergy(val: number) {
  localStorage.setItem(GUEST_ENERGY_KEY, String(val));
}

/**
 * Provides the same interface as useEquipment but backed by localStorage
 * for unauthenticated (guest) users.
 */
export function useGuestEquipment(currentVoidId: string | null) {
  const [catalog, setCatalog] = useState<EquipmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inventory, setInventory] = useState<GuestInventoryItem[]>(loadGuestInventory);
  const [energy, setEnergy] = useState<number>(loadGuestEnergy);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Fetch catalog from DB (public read)
  useEffect(() => {
    supabase
      .from('equipment_catalog')
      .select('*')
      .order('category')
      .order('tier')
      .then(({ data }) => {
        if (data) setCatalog(data as EquipmentItem[]);
        setIsLoading(false);
      });
  }, []);

  // Persist changes
  useEffect(() => {
    saveGuestInventory(inventory);
  }, [inventory]);

  useEffect(() => {
    saveGuestEnergy(energy);
  }, [energy]);

  const owned: OwnedEquipment[] = inventory.map(i => ({
    id: i.id,
    user_id: 'guest',
    equipment_id: i.equipment_id,
    void_id: i.void_id,
    purchased_at: i.purchased_at,
    is_active: true,
  }));

  const purchaseEquipment = useCallback(async (equipmentId: string) => {
    const item = catalog.find(e => e.id === equipmentId);
    if (!item) throw new Error('Item not found');
    if (energy < item.energy_cost) throw new Error('Insufficient energy');

    setIsPurchasing(true);
    try {
      const newItem: GuestInventoryItem = {
        id: crypto.randomUUID(),
        equipment_id: equipmentId,
        void_id: null,
        purchased_at: new Date().toISOString(),
      };
      setInventory(prev => [...prev, newItem]);
      setEnergy(prev => prev - item.energy_cost);
    } finally {
      setIsPurchasing(false);
    }
  }, [catalog, energy]);

  const installEquipment = useCallback(async (playerEquipmentId: string, voidId: string) => {
    setInventory(prev =>
      prev.map(i => (i.id === playerEquipmentId ? { ...i, void_id: voidId } : i))
    );
  }, []);

  const uninstallEquipment = useCallback(async (playerEquipmentId: string) => {
    setInventory(prev =>
      prev.map(i => (i.id === playerEquipmentId ? { ...i, void_id: null } : i))
    );
  }, []);

  return {
    catalog,
    owned,
    energy,
    isLoading,
    purchaseEquipment,
    isPurchasing,
    installEquipment,
    uninstallEquipment,
  };
}
