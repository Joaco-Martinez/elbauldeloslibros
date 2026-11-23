import type { MetadataRoute } from 'next';
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/seo';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: 'El Baul',
    description: SITE_DESCRIPTION,
    lang: 'es-AR',
    start_url: '/',
    display: 'standalone',
    background_color: '#F6E7C6',
    theme_color: '#B04028',
    icons: [
      { src: '/icon.svg', type: 'image/svg+xml', sizes: 'any' },
      { src: '/apple-icon', type: 'image/png', sizes: '180x180' },
    ],
  };
}
