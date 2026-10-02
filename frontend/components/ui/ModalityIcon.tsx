import {
  ArrowsLeftRightIcon,
  ChalkboardTeacherIcon,
  LaptopIcon,
} from '@phosphor-icons/react/dist/ssr';
import type { ProgramModality } from '@/lib/types';

const ICON = {
  Presencial: ChalkboardTeacherIcon,
  Virtual: LaptopIcon,
  Hibrida: ArrowsLeftRightIcon,
} as const;

/** Icono de la modalidad de un programa (Phosphor): en el aula, en línea o entre ambas. */
export function ModalityIcon({
  modality,
  className,
}: {
  modality: ProgramModality;
  className?: string;
}) {
  const Icon = ICON[modality] ?? ChalkboardTeacherIcon;
  return <Icon aria-hidden weight="duotone" className={className} />;
}
