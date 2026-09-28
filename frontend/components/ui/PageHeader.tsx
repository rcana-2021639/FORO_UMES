import type { ReactNode } from 'react';
import { Words } from './Words';
import { SeatMark } from './Section';

interface Props {
  kicker: string;
  title: ReactNode;
  intro?: ReactNode;
  aside?: ReactNode;
}

/**
 * Cabecera de página interna: kicker itálico con marca de asiento y título que sube palabra a
 * palabra. La entrada la hace el script de arranque (data-reveal), en el primer pintado: el
 * título ya viene partido desde el servidor, así que al hidratar no cambia nada.
 */
export function PageHeader({ kicker, title, intro, aside }: Props) {
  return (
    <header className="container-x grid gap-5 pt-36 pb-14 md:grid-cols-12 md:gap-8 md:pt-44 md:pb-20">
      <div data-reveal="left" className="flex items-start gap-3 md:col-span-3">
        <SeatMark />
        <p className="eyebrow max-w-[18ch] text-fg-muted">{kicker}</p>
      </div>
      <div className="md:col-span-6">
        <h1
          data-reveal-group
          data-reveal={typeof title === 'string' ? undefined : 'blur'}
          className="text-[clamp(2.6rem,6.5vw,6rem)] text-fg"
        >
          {typeof title === 'string' ? <Words text={title} /> : title}
        </h1>
        {intro && (
          <p
            data-reveal="blur"
            className="mt-6 max-w-[54ch] text-[1.05rem] leading-relaxed text-fg-muted"
          >
            {intro}
          </p>
        )}
      </div>
      {aside && (
        <div data-reveal="up" className="md:col-span-3 md:justify-self-end md:self-end">
          {aside}
        </div>
      )}
    </header>
  );
}
