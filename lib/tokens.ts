export type Tone = 'cream' | 'rust' | 'brick' | 'forest' | 'orange' | 'mustard' | 'leaf' | 'moss' | 'beige' | 'ink' | 'leather';

/** Clases completas para que Tailwind las detecte. */
export const bgTone: Record<Tone, string> = {
  cream: 'bg-cream',
  rust: 'bg-rust',
  brick: 'bg-brick',
  forest: 'bg-forest',
  orange: 'bg-orange',
  mustard: 'bg-mustard',
  leaf: 'bg-leaf',
  moss: 'bg-moss',
  beige: 'bg-beige',
  ink: 'bg-ink',
  leather: 'bg-leather',
};

const DARK_TONES: Tone[] = ['rust', 'brick', 'forest', 'leaf', 'moss', 'ink', 'leather'];

export const isDarkTone = (tone: Tone) => DARK_TONES.includes(tone);

export const toneVar = (tone: Tone) => `var(--color-${tone})`;
