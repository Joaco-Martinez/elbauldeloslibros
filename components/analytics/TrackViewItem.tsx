'use client';

import { useEffect } from 'react';
import { track, type AnalyticsItem } from '@/lib/analytics';

/** Avisa a Analytics / Meta que alguien vio un libro (una vez por página). */
export function TrackViewItem({ item }: { item: AnalyticsItem }) {
  useEffect(() => {
    track('view_item', { items: [item] });
    // Solo al entrar a la página del libro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);
  return null;
}
