'use client';

import { useActionState, useEffect, useRef } from 'react';
import { saveSection, type SectionFormState } from '@/app/admin/secciones/actions';
import { bgTone, type Tone } from '@/lib/tokens';

interface SectionFormProps {
  id?: string;
  label?: string;
  blurb?: string;
  tone?: Tone;
  tones: { tone: Tone; label: string }[];
}

const field =
  'mt-1.5 w-full rounded-[10px] border-[1.5px] border-ink bg-cream px-3 py-2 text-[15px] font-medium focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-forest';

/** Nombre, frase y color de una sección (nueva o existente). */
export function SectionForm({ id, label = '', blurb = '', tone, tones }: SectionFormProps) {
  const [state, action, pending] = useActionState<SectionFormState, FormData>(saveSection, {});
  const formRef = useRef<HTMLFormElement>(null);
  const key = id ?? 'nueva';

  // Sección nueva guardada: se vacía el formulario para cargar otra.
  useEffect(() => {
    if (state.ok && !id) formRef.current?.reset();
  }, [state, id]);

  return (
    <form ref={formRef} action={action} className="grid gap-4">
      {id && <input type="hidden" name="id" value={id} />}
      <div className="grid gap-4 sm:grid-cols-[1fr_1.4fr]">
        <div>
          <label htmlFor={`label-${key}`} className="block text-[13px] font-bold">
            Nombre
          </label>
          <input
            id={`label-${key}`}
            name="label"
            required
            maxLength={40}
            defaultValue={label}
            placeholder="Ej. Infantiles"
            className={field}
          />
        </div>
        <div>
          <label htmlFor={`blurb-${key}`} className="block text-[13px] font-bold">
            Frase debajo del nombre
          </label>
          <input
            id={`blurb-${key}`}
            name="blurb"
            maxLength={120}
            defaultValue={blurb}
            placeholder="Ej. Para leer juntos antes de dormir."
            className={field}
          />
        </div>
      </div>
      <fieldset>
        <legend className="text-[13px] font-bold">Color de las tarjetas</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {tones.map((t, i) => (
            <label
              key={t.tone}
              className="flex cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-ink py-1 pl-1 pr-3 text-[12px] font-bold has-[:checked]:bg-ink has-[:checked]:text-cream has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-forest"
            >
              <input
                type="radio"
                name="tone"
                value={t.tone}
                defaultChecked={tone ? tone === t.tone : i === 0}
                className="sr-only"
              />
              <span aria-hidden="true" className={`h-6 w-6 rounded-full border border-ink ${bgTone[t.tone]}`} />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn h-10 bg-forest px-5 text-[14px] text-cream">
          {pending ? 'Guardando…' : id ? 'Guardar' : 'Crear sección'}
        </button>
        {state.error && (
          <p role="alert" className="text-[13px] font-bold text-brick">
            {state.error}
          </p>
        )}
        {state.ok && (
          <p role="status" className="text-[13px] font-bold text-forest">
            Guardado.
          </p>
        )}
      </div>
    </form>
  );
}
