import { useEquipment } from './useEquipment';
import { useGuestEquipment } from './useGuestEquipment';

/**
 * Unified hook: uses server-backed equipment for logged-in users,
 * localStorage-backed equipment for guests.
 */
export function useEquipmentUnified(userId: string | null, currentVoidId: string | null) {
  const serverEquipment = useEquipment(userId, currentVoidId);
  const guestEquipment = useGuestEquipment(currentVoidId);

  // If user is logged in, use server data; otherwise use guest/local data
  if (userId) return serverEquipment;
  return guestEquipment;
}
