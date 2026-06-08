'use client';
// hooks/useCompare.ts

import { useState } from 'react';

const MAX_COMPARE = 3;

export function useCompare() {
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const addToCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev;
      if (prev.length >= MAX_COMPARE) return prev;
      const next = [...prev, id];
      return next;
    });
  };

  const removeFromCompare = (id: string) => {
    setCompareIds(prev => {
      const next = prev.filter(c => c !== id);
      if (next.length === 0) setShowCompare(false);
      return next;
    });
  };

  const clearCompare = () => {
    setCompareIds([]);
    setShowCompare(false);
  };

  const isInCompare = (id: string) => compareIds.includes(id);

  return {
    compareIds,
    showCompare,
    setShowCompare,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isInCompare,
    canAdd: compareIds.length < MAX_COMPARE,
  };
}
