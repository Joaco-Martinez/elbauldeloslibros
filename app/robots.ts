import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Panel, API y páginas privadas de cada compra: no tienen que aparecer en Google.
      disallow: ['/admin', '/api/', '/checkout', '/pedido/'],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
