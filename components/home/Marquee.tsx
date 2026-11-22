import { Sticker } from '@/components/ui/Sticker';
import { WaveDivider } from '@/components/ui/WaveDivider';

const GENRES = ['Desarrollo personal', 'Finanzas', 'Negocios', 'Filosofía', 'Espiritualidad', 'Romance', 'Thriller'];

function Row({ hidden }: { hidden?: boolean }) {
  // Se repite dos veces para cubrir pantallas anchas.
  const items = [...GENRES, ...GENRES];
  return (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((genre, i) => (
        <li key={`${genre}-${i}`} className="flex items-center">
          <span className="display t-marquee whitespace-nowrap px-4 md:px-6">{genre}</span>
          <Sticker variant="sun" size={30} inline plain float={false} />
        </li>
      ))}
    </ul>
  );
}

export function Marquee() {
  return (
    <>
      <section aria-label="Géneros que vendemos" className="overflow-hidden bg-forest py-5 text-cream md:py-6">
        <div className="marquee-track flex w-max">
          <Row />
          <Row hidden />
        </div>
      </section>
      <WaveDivider top="forest" bottom="orange" variant={1} />
    </>
  );
}
