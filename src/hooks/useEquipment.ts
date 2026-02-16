import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EquipmentItem {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  energy_cost: number;
  tier: number;
  effect_key: string;
}

export interface OwnedEquipment {
  id: string;
  user_id: string;
  equipment_id: string;
  void_id: string | null;
  purchased_at: string;
  is_active: boolean;
}

export function useEquipment(userId: string | null, currentVoidId: string | null) {
  const queryClient = useQueryClient();

  const catalogQuery = useQuery({
    queryKey: ['equipment-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_catalog')
        .select('*')
        .order('category')
        .order('tier');
      if (error) throw error;
      return data as EquipmentItem[];
    },
  });

  const ownedQuery = useQuery({
    queryKey: ['player-equipment', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_equipment')
        .select('*')
        .eq('user_id', userId!);
      if (error) throw error;
      return data as OwnedEquipment[];
    },
    enabled: !!userId,
  });

  const energyQuery = useQuery({
    queryKey: ['player-energy', userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('ensure_player_energy');
      if (error) throw error;
      return data as number;
    },
    enabled: !!userId,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (equipmentId: string) => {
      const item = catalogQuery.data?.find(e => e.id === equipmentId);
      if (!item) throw new Error('Item not found');

      const currentBalance = energyQuery.data ?? 0;
      if (currentBalance < item.energy_cost) throw new Error('Insufficient energy');

      // Deduct energy
      const { error: energyError } = await supabase
        .from('player_energy')
        .update({ balance: currentBalance - item.energy_cost, updated_at: new Date().toISOString() })
        .eq('user_id', userId!);
      if (energyError) throw energyError;

      // Insert equipment
      const { error: equipError } = await supabase
        .from('player_equipment')
        .insert({ user_id: userId!, equipment_id: equipmentId });
      if (equipError) throw equipError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player-equipment', userId] });
      queryClient.invalidateQueries({ queryKey: ['player-energy', userId] });
    },
  });

  const installMutation = useMutation({
    mutationFn: async ({ playerEquipmentId, voidId }: { playerEquipmentId: string; voidId: string }) => {
      const { error } = await supabase
        .from('player_equipment')
        .update({ void_id: voidId })
        .eq('id', playerEquipmentId)
        .eq('user_id', userId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player-equipment', userId] });
    },
  });

  const uninstallMutation = useMutation({
    mutationFn: async (playerEquipmentId: string) => {
      const { error } = await supabase
        .from('player_equipment')
        .update({ void_id: null })
        .eq('id', playerEquipmentId)
        .eq('user_id', userId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player-equipment', userId] });
    },
  });

  return {
    catalog: catalogQuery.data ?? [],
    owned: ownedQuery.data ?? [],
    energy: energyQuery.data ?? 0,
    isLoading: catalogQuery.isLoading,
    purchaseEquipment: purchaseMutation.mutateAsync,
    isPurchasing: purchaseMutation.isPending,
    installEquipment: (playerEquipmentId: string, voidId: string) =>
      installMutation.mutateAsync({ playerEquipmentId, voidId }),
    uninstallEquipment: uninstallMutation.mutateAsync,
  };
}
