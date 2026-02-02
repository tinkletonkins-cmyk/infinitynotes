import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HistoryEntry {
  id: string;
  note_id: string;
  text: string;
  color: string | null;
  shape: string | null;
  changed_at: string;
}

export function useNoteHistory(noteId: string | null) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch history when noteId changes
  useEffect(() => {
    if (!noteId) {
      setHistory([]);
      return;
    }

    const fetchHistory = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('note_history')
        .select('*')
        .eq('note_id', noteId)
        .order('changed_at', { ascending: false });
      
      if (!error && data) {
        setHistory(data.map(h => ({
          id: h.id,
          note_id: h.note_id,
          text: h.text,
          color: h.color,
          shape: h.shape,
          changed_at: h.changed_at,
        })));
      }
      setIsLoading(false);
    };
    
    fetchHistory();
  }, [noteId]);

  const addHistoryEntry = useCallback(async (
    noteId: string, 
    text: string, 
    color: string | null, 
    shape: string | null
  ) => {
    await supabase.from('note_history').insert({
      note_id: noteId,
      text,
      color,
      shape,
    });
  }, []);

  return { history, isLoading, addHistoryEntry };
}
