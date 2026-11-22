import { createHmac } from 'node:crypto';
import { cookies } from 'next/headers';
import { safeEqual } from '@/lib/tokenCompare';

export const ADMIN_COOKIE = 'bdl_admin';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 días

/** El panel solo existe si hay ADMIN_PASSWORD en .env.local. */
export const adminEnabled = () => Boolean(process.env.ADMIN_PASSWORD);

/** Valor de la cookie: firma derivada de la contraseña (cambiarla cierra todas las sesiones). */
function sessionValue() {
  const password = process.env.ADMIN_PASSWORD ?? '';
  return createHmac('sha256', password).update('bdl-admin-session-v1').digest('hex');
}

export async function isAdmin() {
  if (!adminEnabled()) return false;
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  return Boolean(value) && safeEqual(value!, sessionValue());
}

export function checkPassword(input: string) {
  const password = process.env.ADMIN_PASSWORD;
  return Boolean(password) && safeEqual(input, password!);
}

export async function startSession() {
  (await cookies()).set(ADMIN_COOKIE, sessionValue(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}
