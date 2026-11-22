import type { Config } from 'tailwindcss';

const tone = (name: string) => `var(--color-${name})`;

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}', './data/**/*.{ts,tsx}'],
  theme: {
    // Solo colores de marca: nada de la paleta por defecto.
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      cream: tone('cream'),
      rust: tone('rust'),
      brick: tone('brick'),
      forest: tone('forest'),
      orange: tone('orange'),
      mustard: tone('mustard'),
      leaf: tone('leaf'),
      moss: tone('moss'),
      beige: tone('beige'),
      ink: tone('ink'),
      leather: tone('leather'),
    },
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        script: ['var(--font-script)', 'cursive'],
      },
      spacing: {
        xs: 'var(--space-xs)',
        sm: 'var(--space-sm)',
        md: 'var(--space-md)',
        lg: 'var(--space-lg)',
        xl: 'var(--space-xl)',
        '2xl': 'var(--space-2xl)',
      },
      borderRadius: {
        card: 'var(--radius-card)',
      },
    },
  },
  plugins: [],
  // Las clases hover: solo se aplican con mouse (en celular el toque las dispara y quedan "pegadas").
  future: { hoverOnlyWhenSupported: true },
};

export default config;
