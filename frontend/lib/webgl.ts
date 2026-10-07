/**
 * Comprobaciones de WebGL compartidas (portada: noticias elásticas y galería que se funde).
 */

let glCache: boolean | null = null;
/**
 * ¿Se puede crear un contexto WebGL? Crearlo cuesta: en una computadora con gráficos integrados
 * tomaba ~0,4 s del hilo principal. Por eso solo se pregunta cuando la sección está cerca (antes se
 * preguntaba al cargar la portada) y el contexto de prueba se libera enseguida.
 */
export function webglAvailable() {
  if (glCache === null) {
    try {
      const c = document.createElement('canvas');
      const ctx = c.getContext('webgl2') || c.getContext('webgl');
      glCache = !!ctx;
      ctx?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      glCache = false;
    }
  }
  return glCache;
}
