import { SOCIAL_LINKS } from '@/lib/site';

/** Links a Instagram y TikTok en pastillas outline (sin íconos, como el resto del sitio). */
export function SocialLinks({
  className = '',
  size = 'sm',
  withHandle = false,
}: {
  className?: string;
  size?: 'sm' | 'md';
  /** Muestra el usuario (@elbauldeloslibros.ok) además de la red. */
  withHandle?: boolean;
}) {
  if (SOCIAL_LINKS.length === 0) return null;
  const sizing = size === 'md' ? 'h-11 px-5 text-[14px]' : 'h-8 px-3.5 text-[13px]';
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`} aria-label="Redes sociales">
      {SOCIAL_LINKS.map((s) => (
        <li key={s.label}>
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn gap-1.5 border-[1.5px] border-current ${sizing}`}
            style={{ ['--ring' as string]: 'currentColor' }}
          >
            {s.label}
            {withHandle && <span className="font-medium opacity-90">@{s.handle}</span>}
            <span className="sr-only">{withHandle ? ' (abre en otra pestaña)' : ` (@${s.handle}, abre en otra pestaña)`}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
