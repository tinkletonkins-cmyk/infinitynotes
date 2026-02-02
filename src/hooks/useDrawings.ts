import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Drawing {
  id: string;
  path_data: string;
  color: string;
  stroke_width: number;
  void_id: string | null;
}

export function useDrawings(voidId: string | null = null) {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial drawings
  useEffect(() => {
    const fetchDrawings = async () => {
      setIsLoading(true);
      let query = supabase
        .from('board_drawings')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (voidId) {
        query = query.eq('void_id', voidId);
      } else {
        query = query.is('void_id', null);
      }
      
      const { data, error } = await query;
      
      if (!error && data) {
        setDrawings(data.map(d => ({
          id: d.id,
          path_data: d.path_data,
          color: d.color,
          stroke_width: d.stroke_width,
          void_id: d.void_id,
        })));
      }
      setIsLoading(false);
    };
    
    fetchDrawings();
  }, [voidId]);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel(`drawings-realtime-${voidId ?? 'public'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'board_drawings' },
        (payload) => {
          const d = payload.new as any;
          const drawingVoidId = d?.void_id ?? null;
          const oldDrawingVoidId = (payload.old as any)?.void_id ?? null;
          
          if (payload.eventType === 'INSERT') {
            if (drawingVoidId !== voidId) return;
            setDrawings(prev => {
              if (prev.some(drawing => drawing.id === d.id)) return prev;
              return [...prev, {
                id: d.id,
                path_data: d.path_data,
                color: d.color,
                stroke_width: d.stroke_width,
                void_id: d.void_id,
              }];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldD = payload.old as any;
            if (oldDrawingVoidId !== voidId) return;
            setDrawings(prev => prev.filter(drawing => drawing.id !== oldD.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [voidId]);

  const addDrawing = useCallback(async (pathData: string, color: string, strokeWidth: number) => {
    const { data, error } = await supabase.from('board_drawings').insert({
      path_data: pathData,
      color,
      stroke_width: strokeWidth,
      void_id: voidId,
    }).select().single();

    if (!error && data) {
      return data.id;
    }
    return null;
  }, [voidId]);

  const deleteDrawing = useCallback(async (id: string) => {
    setDrawings(prev => prev.filter(d => d.id !== id));
    await supabase.from('board_drawings').delete().eq('id', id);
  }, []);

  const clearAllDrawings = useCallback(async () => {
    const ids = drawings.map(d => d.id);
    setDrawings([]);
    for (const id of ids) {
      await supabase.from('board_drawings').delete().eq('id', id);
    }
  }, [drawings]);

  return { drawings, isLoading, addDrawing, deleteDrawing, clearAllDrawings };
}
