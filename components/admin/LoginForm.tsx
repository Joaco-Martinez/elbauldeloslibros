'use client';

import { useActionState } from 'react';
import { login, type ActionState } from '@/app/admin/actions';
import { Button } from '@/components/ui/Button';
import { adminInput } from './styles';

/** `next`: a qué página del panel volver después de entrar (por defecto, Pedidos). */
export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(login, {});
  return (
    <form action={action} className="mx-auto max-w-[380px]">
      {next && <input type="hidden" name="next" value={next} />}
      <label htmlFor="password" className="mb-1.5 block text-[13px] font-bold">
        Contraseña del panel
      </label>
      <input id="password" name="password" type="password" required autoComplete="current-password" className={adminInput} />
      {state.error && (
        <p role="alert" className="mt-3 text-[13px] font-bold text-brick">
          {state.error}
        </p>
      )}
      <Button type="submit" variant="forest" className="mt-5 w-full" disabled={pending}>
        {pending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  );
}
