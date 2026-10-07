'use client';

import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { sameOriginImage } from '@/lib/api';
import { useQuality } from '@/lib/quality';
import { useNear } from '@/hooks/useNear';
import { webglAvailable } from '@/lib/webgl';
import { Chevron } from '@/components/ui/Chevron';
import { Note } from '@/components/ui/Note';
import { Lightbox, toEntry, type Entry } from './GalleryShowcase';
import type { MorphItem, MorphSliderHandle } from './MorphSlider';
import type { GalleryItem } from '@/lib/types';

const MorphSlider = dynamic(() => import('./MorphSlider').then((m) => m.MorphSlider), {
  ssr: false,
});

const SIZES = '(min-width: 1024px) 70vw, 100vw';

/**
 * Galería de la portada (DESIGN_NOTES §29.5): la foto grande se funde en la siguiente con el
 * `MorphSlider` (transición "melt", WebGL) y al lado está la hoja de contactos del fotógrafo: las
 * miniaturas en una tira de película, con la que se ve encerrada a lápiz graso. Arrastrar la foto
 * "frota" la transición; click la amplía. La vista /galeria conserva su carrusel (GalleryShowcase).
 *
 * El WebGL se crea al acercarse y solo en modo completo; antes (y en modo liviano o sin WebGL) la
 * misma composición funciona con fotos normales y un fundido.
 */
export function HomeGallery({ items }: { items: GalleryItem[] }) {
  const photos = useMemo(
    () => items.map(toEntry).filter((e) => e.kind === 'image' && e.poster),
    [items]
  );
  const quality = useQuality();
  const wrap = useRef<HTMLDivElement>(null);
  const near = useNear(wrap);
  // Texturas del tamaño que de verdad se dibuja (la foto ocupa ~72 % del ancho, hasta 1.5x)
  // Se calcula al acercarse (en el cliente): antes no hace falta
  const slides: MorphItem[] = useMemo(() => {
    if (!near) return [];
    const px =
      Math.min(window.innerWidth, 1600) * 0.72 * Math.min(window.devicePixelRatio || 1, 1.5);
    const w = px > 1200 ? 1920 : 1200;
    return photos.map((p) => ({ image: sameOriginImage(p.poster, w), caption: p.title }));
  }, [photos, near]);
  const webgl = useMemo(() => near && quality === 'full' && webglAvailable(), [near, quality]);
  const handle = useRef<MorphSliderHandle>(null);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState<Entry | null>(null);

  if (!photos.length) {
    return (
      <p className="container-x max-w-[48ch] text-fg-muted">
        Todavía no hay fotos publicadas. Las de los próximos encuentros aparecerán aquí.
      </p>
    );
  }

  const pick = (i: number) => {
    if (webgl) handle.current?.goToIndex(i);
    else setIndex(i);
  };
  const caption = (_: MorphItem, i: number) => <Caption photo={photos[i]} />;

  return (
    <div ref={wrap} className="hg container-x">
      <div className="hg__main">
        <div className="hg__stage" data-reveal="scale">
          {webgl ? (
            <MorphSlider
              items={slides}
              handleRef={handle}
              transition="melt"
              intensity={0.55}
              aberration={0.35}
              drift={0.4}
              autoplay={false}
              overlayColor="#160f30"
              duration={1.1}
              ease="power2.inOut"
              scale={2.4}
              loop
              radius={16}
              showCaptions
              showControls
              showIndicators
              label="Fotos del Foro"
              renderCaption={caption}
              onIndexChange={setIndex}
              onOpen={(i) => setOpen(photos[i])}
              poster={
                <Image src={photos[0].poster!} alt="" fill sizes={SIZES} className="object-cover" />
              }
            />
          ) : (
            <FadeStage photos={photos} index={index} onPick={pick} onOpen={setOpen} />
          )}
        </div>
        <p className="hg__hint">
          <Note tilt={-2} at={200}>
            arrastra la foto: se funde en la siguiente
          </Note>
        </p>
      </div>

      <ContactSheet photos={photos} index={index} onPick={pick} />
      <Lightbox entry={open} onClose={() => setOpen(null)} />
    </div>
  );
}

/** Pie de foto: una etiqueta de papel pegada con cinta. */
function Caption({ photo }: { photo: Entry }) {
  return (
    <span className="hg-cap">
      <b>{photo.title}</b>
      {photo.subtitle && <small>{photo.subtitle}</small>}
    </span>
  );
}

/** La hoja de contactos: una tira de película con todas las fotos; la actual, encerrada. */
function ContactSheet({
  photos,
  index,
  onPick,
}: {
  photos: Entry[];
  index: number;
  onPick: (i: number) => void;
}) {
  // La miniatura actual queda a la vista dentro de la tira (sin mover la página)
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const c = list.current;
    const el = c?.children[index] as HTMLElement | undefined;
    if (!c || !el) return;
    c.scrollTo({
      top: el.offsetTop - c.clientHeight / 2 + el.clientHeight / 2,
      left: el.offsetLeft - c.clientWidth / 2 + el.clientWidth / 2,
      behavior: 'smooth',
    });
  }, [index]);

  return (
    <div className="hg__sheet">
      <p className="hg__sheet-head" aria-live="polite" data-reveal="up">
        <span>Hoja de contactos</span>
        <span>
          <b>{String(index + 1).padStart(2, '0')}</b> de {String(photos.length).padStart(2, '0')}
        </span>
      </p>
      <ol ref={list} className="hg-sheet" data-reveal-stagger="fade">
        {photos.map((p, i) => (
          <li key={p.id}>
            <button
              type="button"
              className="hg-thumb"
              data-on={i === index || undefined}
              aria-current={i === index || undefined}
              aria-label={`Ver ${p.title}`}
              onClick={() => onPick(i)}
            >
              <span className="hg-thumb__img">
                <Image src={p.poster!} alt="" fill sizes="140px" className="object-cover" />
              </span>
              <span className="hg-thumb__no" aria-hidden>
                {String(i + 1).padStart(2, '0')}A
              </span>
              {/* Lápiz graso: se dibuja alrededor de la que está a la vista */}
              <svg
                className="hg-thumb__mark"
                viewBox="0 0 100 70"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  pathLength={1}
                  d="M14 40C8 20 40 5 70 8c22 3 30 22 22 38-9 17-44 22-66 14C10 54 4 38 16 26c8-8 22-12 34-13"
                />
              </svg>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Sin WebGL (o antes de acercarse): las mismas fotos con un fundido, mismos controles. */
function FadeStage({
  photos,
  index,
  onPick,
  onOpen,
}: {
  photos: Entry[];
  index: number;
  onPick: (i: number) => void;
  onOpen: (e: Entry) => void;
}) {
  const n = photos.length;
  return (
    <div className="morph-slider" style={{ borderRadius: 16 }} data-ready>
      <button
        type="button"
        className="morph-slider__stage hg-fade"
        aria-label={`Ampliar ${photos[index].title}`}
        onClick={() => onOpen(photos[index])}
      >
        {photos.map((p, i) => (
          <Image
            key={p.id}
            src={p.poster!}
            alt=""
            fill
            sizes={SIZES}
            className="object-cover"
            data-on={i === index || undefined}
          />
        ))}
      </button>
      <div className="morph-slider__captions" aria-live="polite">
        {photos.map((p, i) => (
          <span
            key={p.id}
            aria-hidden={i === index ? undefined : true}
            className="morph-slider__caption"
            data-on={i === index || undefined}
          >
            <Caption photo={p} />
          </span>
        ))}
      </div>
      {n > 1 && (
        <>
          <div className="morph-slider__controls">
            <button
              type="button"
              aria-label="Foto anterior"
              onClick={() => onPick((index - 1 + n) % n)}
            >
              <Chevron dir="prev" />
            </button>
            <button
              type="button"
              aria-label="Foto siguiente"
              onClick={() => onPick((index + 1) % n)}
            >
              <Chevron dir="next" />
            </button>
          </div>
          <div className="morph-slider__dots" role="tablist" aria-label="Fotos">
            {photos.map((p, i) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Ir a la foto ${i + 1}`}
                className="morph-slider__dot"
                data-on={i === index || undefined}
                onClick={() => onPick(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
