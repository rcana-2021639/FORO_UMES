import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <div className="container-x section-y pt-40">
      <p className="mono-label text-amber">Prueba de sistema</p>
      <h1 className="mt-4 max-w-4xl">Foro Interuniversitario de Estudios de Posgrado</h1>
      <p className="mt-8 max-w-xl text-fg-muted">
        Sistema base: tokens, tipografía, navbar, botones.
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Button href="/universidades">Ver universidades</Button>
        <Button variant="secondary">Secundario</Button>
        <Button variant="ghost">Ghost</Button>
        <Button loading>Enviar</Button>
      </div>
      <div className="h-[200vh]" />
    </div>
  );
}
