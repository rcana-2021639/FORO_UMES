'use client';

import { useEffect } from 'react';
import { probeFrameRate } from '@/lib/quality';

/** Mide los primeros segundos de fotogramas y baja a modo liviano si el equipo no da abasto. */
export function QualityProbe() {
  useEffect(() => {
    // Tras la hidratación el hilo principal está ocupado; se mide cuando la página ya respira
    let stop = () => {};
    const id = window.setTimeout(() => {
      stop = probeFrameRate();
    }, 1500);
    return () => {
      window.clearTimeout(id);
      stop();
    };
  }, []);
  return null;
}
