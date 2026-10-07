'use client';

import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { mediaUrl, sameOriginImage } from '@/lib/api';
import { formatDate, videoEmbed, videoThumbnail } from '@/lib/format';
import { useQuality } from '@/lib/quality';
import { useNear } from '@/hooks/useNear';
import { EASE } from '@/lib/motion';
import type { GalleryItem } from '@/lib/types';
import type { FlexCarouselHandle, FlexCarouselItem } from '@/components/fx/FlexCarousel';

const FlexCarousel = dynamic(
  () => import('@/components/fx/FlexCarousel').then((m) => m.FlexCarousel),
  { ssr: false }
);

export interface Entry {
  id: string;
  kind: 'image' | 'video';
  /** Imagen que se muestra en el carrusel (foto, miniatura o fotograma). */
  poster: string | null;
  /** Para abrir: la foto grande, el embed de YouTube/Vimeo o el archivo de video. */
  full: string | null;
  embed: string | null;
  file: string | null;
  title: string;
  subtitle?: string;
}

export function toEntry(g: GalleryItem): Entry {
  const isVideo = g.type === 'Video' || !!g.file?.mime?.startsWith('video/');
  const fileUrl = mediaUrl(g.file?.url);
  const img = !isVideo
    ? mediaUrl(g.file?.formats?.large?.url ?? g.file?.formats?.medium?.url ?? g.file?.url)
    : null;
  return {
    id: g.documentId,
    kind: isVideo ? 'video' : 'image',
    poster: isVideo ? videoThumbnail(g.videoUrl) : (img ?? null),
    full: isVideo ? null : (fileUrl ?? img ?? null),
    embed: isVideo ? videoEmbed(g.videoUrl) : null,
    file: isVideo && g.file?.mime?.startsWith('video/') ? (fileUrl ?? null) : null,
    title: g.title ?? (isVideo ? 'Video del Foro' : 'Fotografía del Foro'),
    subtitle:
      [g.relatedActivity?.title, formatDate(g.date)].filter(Boolean).join(' · ') || undefined,
  };
}

/**
 * La miniatura estándar de YouTube (hqdefault) es 4:3 con franjas negras. Se prueba la versión
 * 16:9 en alta (maxresdefault, luego hq720); si no existe, YouTube responde un gris de 120 px.
 * La prueba pasa por el optimizador de Next (mismo origen): el navegador del visitante no contacta
 * a Google hasta que decide reproducir un video (lo promete el aviso de privacidad). El optimizador
 * no agranda imágenes, así que el gris sigue midiendo 120 px.
 */
async function youtubeWide(poster: string): Promise<string> {
  const id = poster.match(/\/vi\/([^/]+)\//)?.[1];
  if (!id) return poster;
  for (const name of ['maxresdefault', 'hq720']) {
    const url = `https://i.ytimg.com/vi/${id}/${name}.jpg`;
    const ok = await new Promise<boolean>((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve(img.naturalWidth > 200);
      img.onerror = () => resolve(false);
      img.src = sameOriginImage(url, 640);
    });
    if (ok) return url;
  }
  return poster;
}

/** Póster para videos subidos al servidor: su primer fotograma, o un cartel violeta si falla. */
async function framePoster(src: string, title: string): Promise<string> {
  try {
    return await new Promise<string>((resolve, reject) => {
      const v = document.createElement('video');
      v.crossOrigin = 'anonymous';
      v.muted = true;
      v.preload = 'auto';
      v.src = src;
      const fail = () => reject(new Error('frame'));
      const timer = window.setTimeout(fail, 6000);
      v.addEventListener('error', fail, { once: true });
      v.addEventListener(
        'loadeddata',
        () => {
          v.currentTime = Math.min(0.5, (v.duration || 1) / 4);
        },
        { once: true }
      );
      v.addEventListener(
        'seeked',
        () => {
          window.clearTimeout(timer);
          const c = document.createElement('canvas');
          c.width = v.videoWidth || 1280;
          c.height = v.videoHeight || 720;
          c.getContext('2d')?.drawImage(v, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.85));
        },
        { once: true }
      );
    });
  } catch {
    const c = document.createElement('canvas');
    c.width = 1280;
    c.height = 720;
    const ctx = c.getContext('2d');
    if (ctx) {
      const g = ctx.createLinearGradient(0, 0, 1280, 720);
      g.addColorStop(0, '#261a4f');
      g.addColorStop(1, '#6443c4');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.moveTo(600, 300);
      ctx.lineTo(600, 420);
      ctx.lineTo(700, 360);
      ctx.closePath();
      ctx.fill();
      ctx.font = '44px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(title.slice(0, 48), 640, 520);
    }
    return c.toDataURL('image/jpeg', 0.85);
  }
}

/**
 * Galería interactiva: carrusel con lente líquida (`FlexCarousel`, WebGL2) para fotos y videos.
 * Arrastra, usa la rueda o las flechas; click en la tarjeta del centro: las fotos se amplían y
 * los videos se abren en un reproductor. En modo liviano o sin WebGL2, una tira con scroll-snap
 * hace lo mismo sin GPU.
 */
export function GalleryShowcase({
  items,
  height = 560,
}: {
  items: GalleryItem[];
  height?: number;
}) {
  const base = useMemo(() => items.map(toEntry), [items]);
  const [posters, setPosters] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<Entry | null>(null);
  const [unsupported, setUnsupported] = useState(false);
  // El carrusel espera a tener las miniaturas definitivas: cambiarlas después reinicia su entrada
  const [postersReady, setPostersReady] = useState(false);
  const quality = useQuality();
  const carousel = useRef<FlexCarouselHandle | null>(null);
  // Miniaturas y carrusel (WebGL) se preparan al acercarse, no al cargar la página
  const wrap = useRef<HTMLDivElement>(null);
  const near = useNear(wrap);

  // Al cerrar el reproductor, la tarjeta ampliada vuelve a su sitio y el carrusel sigue vivo
  const closeViewer = useCallback(() => {
    setOpen(null);
    carousel.current?.closeFocus();
  }, []);

  // Miniaturas de video: fotograma de los subidos y versión 16:9 de las de YouTube
  useEffect(() => {
    if (!near) return;
    let alive = true;
    const jobs = base
      .filter((e) => e.kind === 'video')
      .map((e) => {
        const run = e.poster ? youtubeWide(e.poster) : framePoster(e.file ?? '', e.title);
        return run.then((src) => alive && setPosters((p) => ({ ...p, [e.id]: src })));
      });
    const timeout = new Promise((r) => window.setTimeout(r, 2500));
    Promise.race([Promise.all(jobs), timeout]).then(() => alive && setPostersReady(true));
    return () => {
      alive = false;
    };
  }, [base, near]);

  const entries = base
    .map((e) => ({ ...e, poster: posters[e.id] ?? e.poster ?? null }))
    .filter((e) => e.poster);

  // Texturas por el optimizador de Next: mismo origen (sin CORS) y livianas
  const carouselItems: FlexCarouselItem[] = entries.map((e) => ({
    src: sameOriginImage(e.poster, 1080),
    alt: e.title,
    title: e.title,
    subtitle: e.subtitle,
    kind: e.kind,
  }));

  if (!base.length) {
    return (
      <p className="container-x max-w-[48ch] text-fg-muted">
        Todavía no hay fotos ni videos publicados. Los de los próximos encuentros aparecerán aquí.
      </p>
    );
  }

  const webgl = quality === 'full' && !unsupported && carouselItems.length > 0;
  if (webgl && !postersReady) {
    return <div ref={wrap} aria-hidden className="w-full" style={{ height }} />;
  }

  return (
    <div ref={wrap}>
      {webgl ? (
        <div className="gallery-flex relative w-full" style={{ height }}>
          <FlexCarousel
            items={carouselItems}
            preset="liquid"
            intro="rise"
            cardHeight={0.56}
            gap={14}
            squeeze={0.2}
            focusOnClick
            captions
            fit="natural"
            radius={18}
            captureWheel={false}
            controlRef={carousel}
            onUnsupported={() => setUnsupported(true)}
            onSelect={(i) => {
              const e = entries[i];
              if (e?.kind === 'video') setOpen(e);
            }}
          />
        </div>
      ) : (
        <GalleryStrip entries={entries} onOpen={setOpen} />
      )}
      <Lightbox entry={open} onClose={closeViewer} />
    </div>
  );
}

/** Versión sin GPU: tira horizontal con scroll-snap; la tarjeta centrada crece. */
function GalleryStrip({ entries, onOpen }: { entries: Entry[]; onOpen: (e: Entry) => void }) {
  return (
    <ul className="gallery-strip container-x" aria-label="Galería del Foro">
      {entries.map((e, i) => (
        <motion.li
          key={e.id}
          initial={{ opacity: 0, y: 40, rotate: i % 2 ? 2 : -2 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE.premium, delay: Math.min(i, 6) * 0.07 }}
        >
          <button type="button" onClick={() => onOpen(e)} className="gallery-strip__card group">
            {e.poster && (
              <Image
                src={e.poster}
                alt={e.title}
                fill
                unoptimized={e.poster.startsWith('data:')}
                sizes="(min-width: 768px) 40vw, 80vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            )}
            <span className="gallery-strip__caption">
              {e.kind === 'video' && <span className="flex-video-chip">▶ Video</span>}
              <span className="font-display text-[1.1rem]">{e.title}</span>
            </span>
          </button>
        </motion.li>
      ))}
    </ul>
  );
}

/** Visor a pantalla completa: foto grande, embed de YouTube/Vimeo o archivo de video. */
export function Lightbox({ entry, onClose }: { entry: Entry | null; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!entry) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [entry, onClose]);

  return (
    <AnimatePresence>
      {entry && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={entry.title}
          className="lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="lightbox__frame"
            initial={{ scale: 0.92, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            transition={{ duration: 0.6, ease: EASE.premium }}
            onClick={(e) => e.stopPropagation()}
          >
            {entry.embed ? (
              <iframe
                src={entry.embed}
                title={entry.title}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="h-full w-full"
              />
            ) : entry.file ? (
              <video src={entry.file} controls autoPlay className="h-full w-full bg-black" />
            ) : entry.full ? (
              <Image
                src={entry.full}
                alt={entry.title}
                fill
                sizes="90vw"
                className="object-contain"
              />
            ) : null}
          </motion.div>
          <div className="lightbox__bar" onClick={(e) => e.stopPropagation()}>
            <span className="font-display text-[1.2rem]">{entry.title}</span>
            <button ref={closeRef} type="button" onClick={onClose} className="lightbox__close">
              Cerrar ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
