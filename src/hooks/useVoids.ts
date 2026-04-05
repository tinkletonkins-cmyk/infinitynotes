import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Void {
  id: string;
  name: string;
  owner_id: string | null;
  is_public: boolean;
  invite_code: string | null;
  created_at: string;
  energy_cost: number;
  visual_tier: number;
  is_prime: boolean;
}

export interface VoidMember {
  id: string;
  void_id: string;
  user_id: string;
  role: 'owner' | 'member';
}

export function useVoids(userId: string | null) {
  const [voids, setVoids] = useState<Void[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's voids (owned + member)
  useEffect(() => {
    if (!userId) {
      setVoids([]);
      setIsLoading(false);
      return;
    }

    const fetchVoids = async () => {
      const { data, error } = await supabase
        .from('voids')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setVoids(data as Void[]);
      }
      setIsLoading(false);
    };
    
    fetchVoids();
  }, [userId]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('voids-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'voids' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const v = payload.new as Void;
            setVoids(prev => {
              if (prev.some(void_ => void_.id === v.id)) return prev;
              return [v, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const v = payload.new as Void;
            setVoids(prev => prev.map(void_ => 
              void_.id === v.id ? v : void_
            ));
          } else if (payload.eventType === 'DELETE') {
            const v = payload.old as Void;
            setVoids(prev => prev.filter(void_ => void_.id !== v.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const createVoid = useCallback(async (name: string) => {
    if (!userId) return null;

    const { data, error } = await supabase
      .from('voids')
      .insert({ name, owner_id: userId })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating void:', error);
      return null;
    }
    
    return data as Void;
  }, [userId]);

  const updateVoid = useCallback(async (id: string, updates: Partial<Pick<Void, 'name'>>) => {
    const { error } = await supabase.from('voids').update(updates).eq('id', id);
    if (error) console.error('[useVoids] Failed to update void:', error);
  }, []);

  const deleteVoid = useCallback(async (id: string) => {
    const { error } = await supabase.from('voids').delete().eq('id', id);
    if (error) console.error('[useVoids] Failed to delete void:', error);
  }, []);

  const joinVoidByCode = useCallback(async (inviteCode: string) => {
    if (!userId) return { success: false, error: 'Not logged in' };

    // Find the void by invite code
    const { data: voidData, error: findError } = await supabase
      .from('voids')
      .select('*')
      .eq('invite_code', inviteCode)
      .single();
    
    if (findError || !voidData) {
      return { success: false, error: 'Invalid invite code' };
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('void_members')
      .select('id')
      .eq('void_id', voidData.id)
      .eq('user_id', userId)
      .single();
    
    if (existingMember) {
      return { success: true, void: voidData as Void };
    }

    // Add as member (owner adds members, so we need this to work)
    // For invite codes, we allow self-join
    const { error: joinError } = await supabase
      .from('void_members')
      .insert({ void_id: voidData.id, user_id: userId, role: 'member' });
    
    if (joinError) {
      return { success: false, error: 'Could not join void' };
    }

    return { success: true, void: voidData as Void };
  }, [userId]);

  return { voids, isLoading, createVoid, updateVoid, deleteVoid, joinVoidByCode };
}
