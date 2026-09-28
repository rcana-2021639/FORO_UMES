/**
 * Se vuelve a montar en cada cambio de ruta: el contenido nuevo entra subiendo apenas y con un
 * fundido (solo opacidad y desplazamiento; al terminar no deja `transform`, para no romper los
 * elementos fijos ni las secciones que GSAP fija con el scroll).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
