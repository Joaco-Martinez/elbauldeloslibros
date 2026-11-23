import type { MetadataRoute } from 'next';
import { getAvailableBooks } from '@/lib/stock';
import { absoluteUrl } from '@/lib/seo';

// Se rearma cada hora: un libro que se queda sin stock sale del sitemap (su página da 404).
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const books = await getAvailableBooks();
  const pages: { path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly' }[] = [
    { path: '/', priority: 1, changeFrequency: 'daily' },
    { path: '/catalogo', priority: 0.9, changeFrequency: 'daily' },
    { path: '/nosotros', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/cambios-y-devoluciones', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/arrepentimiento', priority: 0.2, changeFrequency: 'yearly' },
    { path: '/terminos', priority: 0.2, changeFrequency: 'yearly' },
    { path: '/privacidad', priority: 0.2, changeFrequency: 'yearly' },
  ];
  return [
    ...pages.map((p) => ({ url: absoluteUrl(p.path), changeFrequency: p.changeFrequency, priority: p.priority })),
    ...books.map((b) => ({
      url: absoluteUrl(`/catalogo/${b.id}`),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
