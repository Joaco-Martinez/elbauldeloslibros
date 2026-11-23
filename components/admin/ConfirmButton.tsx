'use client';

import type { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';

/** Botón de envío que pide confirmación antes (para borrar o deshacer cambios). */
export function ConfirmButton({ message, className, children }: { message: string; className?: string; children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {pending ? '…' : children}
    </button>
  );
}
