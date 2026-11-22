import type { ReactNode } from 'react';

interface SectionHeadingProps {
  id: string;
  title: ReactNode;
  as?: 'h2' | 'h3';
  /** Clase de tamaño de la escala display. */
  size?: 't-section' | 't-category';
  titleClassName?: string;
  subtitle?: string;
  subtitleClassName?: string;
  /** Acción a la derecha, alineada con la base del título. */
  action?: ReactNode;
  /** Decoración junto al título (ej. pegatina). */
  decoration?: ReactNode;
}

export function SectionHeading({
  id,
  title,
  as: Tag = 'h2',
  size = 't-section',
  titleClassName = '',
  subtitle,
  subtitleClassName = '',
  action,
  decoration,
}: SectionHeadingProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div>
        <div className="relative inline-block pr-2">
          <Tag id={id} className={`display ${size} ${titleClassName}`}>
            {title}
          </Tag>
          {decoration}
        </div>
        {subtitle && (
          <p className={`mt-2 text-[13px] font-medium md:text-[14px] ${subtitleClassName}`}>{subtitle}</p>
        )}
      </div>
      {action && <div className="pb-1">{action}</div>}
    </div>
  );
}
