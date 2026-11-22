'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Al abrir el panel, vence los pedidos sin pagar de más de 24 h y, si hubo alguno, recarga la lista. */
export function ExpireOnLoad() {
  const router = useRouter();
  useEffect(() => {
    fetch('/api/cron/vencimientos', { method: 'POST' })
      .then((r) => r.json())
      .then((data: { expired?: number }) => {
        if (data.expired) router.refresh();
      })
      .catch(() => undefined);
  }, [router]);
  return null;
}
