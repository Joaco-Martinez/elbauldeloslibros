import { ImageResponse } from 'next/og';

// Ícono para "Agregar a inicio" en iPhone (el SVG de app/icon.svg en PNG de 180 px).
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#0b2e1a' }}>
        <svg viewBox="0 0 64 64" width="180" height="180">
          <path d="M32 20c-5-4-12-5-19-4v29c7-1 14 0 19 4z" fill="#f6e7c6" />
          <path d="M32 20c5-4 12-5 19-4v29c-7-1-14 0-19 4z" fill="#d9c6a3" />
          <path d="M32 20v29" stroke="#b04028" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M18 23c3.5-.4 6.5 0 9 1.2M18 29c3.5-.4 6.5 0 9 1.2M18 35c3.5-.4 6.5 0 9 1.2" stroke="#c74e2e" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <path d="M46 23c-3.5-.4-6.5 0-9 1.2M46 29c-3.5-.4-6.5 0-9 1.2M46 35c-3.5-.4-6.5 0-9 1.2" stroke="#6b3f1f" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    ),
    size,
  );
}
