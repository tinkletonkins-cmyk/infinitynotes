import { useState, useCallback, useEffect } from 'react';

export interface LocalVoid {
  id: string;
  name: string;
  createdAt: number;
  inviteCode: string;
}

const STORAGE_KEY = 'void-local-voids';

function load(): LocalVoid[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function save(voids: LocalVoid[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(voids));
}

function generateCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function useLocalVoids() {
  const [voids, setVoids] = useState<LocalVoid[]>(load);

  useEffect(() => {
    save(voids);
  }, [voids]);

  const createVoid = useCallback((name: string): LocalVoid => {
    const v: LocalVoid = {
      id: crypto.randomUUID(),
      name: name.trim() || 'Untitled Void',
      createdAt: Date.now(),
      inviteCode: generateCode(),
    };
    setVoids(prev => [v, ...prev]);
    return v;
  }, []);

  const deleteVoid = useCallback((id: string) => {
    setVoids(prev => prev.filter(v => v.id !== id));
  }, []);

  const renameVoid = useCallback((id: string, name: string) => {
    setVoids(prev => prev.map(v => v.id === id ? { ...v, name } : v));
  }, []);

  const addVoid = useCallback((v: LocalVoid) => {
    setVoids(prev => prev.some(x => x.id === v.id) ? prev : [v, ...prev]);
  }, []);

  return { voids, createVoid, deleteVoid, renameVoid, addVoid };
}
