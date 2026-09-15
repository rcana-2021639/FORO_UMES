'use client';

import type { ReactNode } from 'react';
import { useMagnetic } from '@/hooks/useMagnetic';
import { cn } from '@/lib/cn';

interface Props {
  children: ReactNode;
  radius?: number;
  strength?: number;
  className?: string;
  as?: 'div' | 'span' | 'li';
}

/** Envoltorio magnético para links, iconos y elementos pequeños. */
export function Magnetic({ children, radius = 40, strength = 0.3, className, as = 'div' }: Props) {
  const { ref } = useMagnetic<HTMLDivElement>({ radius, strength, innerStrength: 0 });
  const Tag = as;
  return (
    <Tag ref={ref as React.Ref<never>} className={cn('inline-block', className)}>
      {children}
    </Tag>
  );
}
