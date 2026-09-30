import { NextResponse, type NextRequest } from 'next/server';
import { isDocumentId } from '@/lib/document-id';

/**
 * Las páginas de detalle se envían por partes (streaming, por app/loading.tsx): si el registro no
 * existe, el código HTTP ya salió como 200 y Next solo puede marcar la página con noindex (un
 * "404 blando"). Un id con formato imposible —URL inventada, mal copiada o de un escáner— se
 * descarta aquí, antes de renderizar: 404 de verdad y ni una consulta a la API.
 * Solo se valida el formato; nada de fetch (el proxy corre en cada una de estas visitas).
 */
export function proxy(request: NextRequest) {
  const id = request.nextUrl.pathname.split('/')[2] ?? '';
  if (isDocumentId(id)) return NextResponse.next();
  // Una ruta que no existe: Next responde app/not-found.tsx con estado 404
  return NextResponse.rewrite(new URL('/404', request.url));
}

export const config = {
  matcher: ['/noticias/:id', '/actividades/:id', '/universidades/:id'],
};
