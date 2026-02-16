import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useVoidNoteCounts(voidIds: string[]) {
  const [noteCounts, setNoteCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (voidIds.length === 0) {
      setNoteCounts({});
      return;
    }

    const fetchCounts = async () => {
      // Fetch notes grouped by void_id for all relevant voids
      const { data, error } = await supabase
        .from('notes')
        .select('void_id')
        .in('void_id', voidIds);

      if (!error && data) {
        const counts: Record<string, number> = {};
        for (const row of data) {
          if (row.void_id) {
            counts[row.void_id] = (counts[row.void_id] || 0) + 1;
          }
        }
        setNoteCounts(counts);
      }
    };

    fetchCounts();
  }, [voidIds.join(',')]);

  // Also count public void (null void_id)
  useEffect(() => {
    const fetchPublicCount = async () => {
      const { count, error } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .is('void_id', null);

      if (!error && count !== null) {
        setNoteCounts(prev => ({ ...prev, __public__: count }));
      }
    };

    fetchPublicCount();
  }, []);

  return noteCounts;
}
