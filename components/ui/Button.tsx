import Link from 'next/link';
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react';

type Variant = 'cream' | 'rust' | 'forest' | 'gold' | 'outline';
type Size = 'md' | 'sm';

const VARIANTS: Record<Variant, { className: string; ring: string }> = {
  // Texto chico: terracota oscuro (brick) para pasar AA.
  cream: { className: 'bg-cream text-brick', ring: 'var(--color-cream)' },
  rust: { className: 'bg-brick text-cream', ring: 'var(--color-forest)' },
  forest: { className: 'bg-forest text-cream', ring: 'var(--color-forest)' },
  // Acción principal de compra (mismo dorado que "Agregar al carrito").
  gold: { className: 'bg-mustard text-forest', ring: 'var(--color-cream)' },
  outline: { className: 'border-[1.5px] border-current bg-transparent', ring: 'currentColor' },
};

const SIZES: Record<Size, string> = {
  md: 'h-11 px-5 text-[14px]',
  sm: 'h-8 px-3.5 text-[13px]',
};

interface BaseProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

type LinkProps = BaseProps & { href: string } & Omit<ComponentPropsWithoutRef<typeof Link>, 'href' | 'className'>;
type ButtonProps = BaseProps & { href?: undefined } & Omit<ComponentPropsWithoutRef<'button'>, 'className'>;

export function Button(props: LinkProps | ButtonProps) {
  const { variant = 'cream', size = 'md', className = '', children } = props;
  const v = VARIANTS[variant];
  const classes = `btn ${v.className} ${SIZES[size]} ${className}`;
  const style = { '--ring': v.ring } as CSSProperties;

  if (props.href !== undefined) {
    const { variant: _v, size: _s, className: _c, children: _ch, href, ...rest } = props;
    return (
      <Link href={href} className={classes} style={style} {...rest}>
        {children}
      </Link>
    );
  }

  const { variant: _v, size: _s, className: _c, children: _ch, href: _h, type = 'button', ...rest } = props;
  return (
    <button type={type} className={classes} style={style} {...rest}>
      {children}
    </button>
  );
}
