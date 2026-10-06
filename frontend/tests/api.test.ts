import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  MAX_PAGE,
  allPages,
  apiFetch,
  critical,
  describeError,
  findOne,
  parsePage,
  safe,
} from '@/lib/api';
import { isDocumentId } from '@/lib/document-id';

const VALID_ID = 'w9k05ib1z664iot1p8nfdjn0';
/** Cabeceras con las que se llamó a fetch en la llamada `i`. */
const headersOf = (mock: { mock: { calls: unknown[][] } }, i: number) =>
  (mock.mock.calls[i][1] as RequestInit).headers as Record<string, string>;
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('isDocumentId', () => {
  it('acepta los documentId de Strapi 5 y rechaza todo lo demás', () => {
    expect(isDocumentId(VALID_ID)).toBe(true);
    for (const bad of [
      '',
      'abc',
      '../../admin',
      '<script>',
      'W9K05IB1Z664IOT1P8NFDJN0',
      `${VALID_ID}x`.repeat(2),
      'a b c d e f g h i j k l m',
    ]) {
      expect(isDocumentId(bad)).toBe(false);
    }
  });
});

describe('parsePage', () => {
  it('convierte ?pagina= en un entero válido entre 1 y MAX_PAGE', () => {
    expect(parsePage('3')).toBe(3);
    expect(parsePage(['4', '9'])).toBe(4);
    expect(parsePage('999999999')).toBe(MAX_PAGE);
    for (const bad of [undefined, '', 'abc', '0', '-3', '1.5', '1e400', 'NaN']) {
      expect(parsePage(bad)).toBe(1);
    }
  });
});

describe('critical y safe', () => {
  const boom = () => Promise.reject(new Error('API caída'));

  it('critical lanza el error en tiempo de ejecución (Next conserva la última versión buena)', async () => {
    vi.stubEnv('NEXT_PHASE', '');
    await expect(critical(boom(), [])).rejects.toThrow('API caída');
  });
  it('critical usa el respaldo solo durante next build', async () => {
    vi.stubEnv('NEXT_PHASE', 'phase-production-build');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(critical(boom(), ['respaldo'])).resolves.toEqual(['respaldo']);
  });
  it('safe siempre usa el respaldo (datos complementarios)', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(safe(boom(), null)).resolves.toBeNull();
    await expect(safe(Promise.resolve(7), null)).resolves.toBe(7);
  });
});

describe('findOne', () => {
  it('un id con formato imposible no llega a la API', async () => {
    const load = vi.fn();
    await expect(findOne('../../admin', load)).resolves.toBeNull();
    expect(load).not.toHaveBeenCalled();
  });
  it('404 → null (la página llama a notFound); otro error se propaga', async () => {
    const notFound = new ApiError({ status: 404, code: 'NOT_FOUND', message: 'No' });
    await expect(findOne(VALID_ID, () => Promise.reject(notFound))).resolves.toBeNull();
    const down = new ApiError({ status: 500, code: 'INTERNAL_SERVER_ERROR', message: 'x' });
    await expect(findOne(VALID_ID, () => Promise.reject(down))).rejects.toBe(down);
  });
  it('devuelve el registro', async () => {
    const load = vi.fn().mockResolvedValue({ data: { title: 'Hola' }, meta: {} });
    await expect(findOne(VALID_ID, load)).resolves.toEqual({ title: 'Hola' });
    expect(load).toHaveBeenCalledWith(VALID_ID);
  });
});

describe('allPages', () => {
  const page = (n: number, pageCount: number) => ({
    data: [n],
    meta: { pagination: { page: n, pageSize: 1, pageCount, total: pageCount } },
  });
  it('junta todas las páginas, con tope', async () => {
    await expect(allPages((n) => Promise.resolve(page(n, 3)))).resolves.toEqual([1, 2, 3]);
    const load = vi.fn((n: number) => Promise.resolve(page(n, 500)));
    await expect(allPages(load, 4)).resolves.toEqual([1, 2, 3, 4]);
    expect(load).toHaveBeenCalledTimes(4);
  });
});

describe('apiFetch', () => {
  it('lanza ApiError con el formato del backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          json(
            { error: { status: 429, code: 'RATE_LIMITED', message: 'Espere', requestId: 'r-1' } },
            429
          )
        )
    );
    const err = await apiFetch('/universities').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 429, code: 'RATE_LIMITED', requestId: 'r-1' });
  });

  it('toda consulta lleva tiempo límite: una API colgada no deja la página esperando', async () => {
    // El plazo ya venció: la API "colgada" solo responde cuando la señal la cancela
    const expired = AbortSignal.abort(new DOMException('plazo vencido', 'TimeoutError'));
    const timeout = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(expired);
    const hung = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          if (init.signal?.aborted) reject(init.signal.reason);
        })
    );
    vi.stubGlobal('fetch', hung);

    const err = await apiFetch('/universities').catch((e) => e);
    expect(timeout).toHaveBeenCalledWith(10_000); // en el servidor
    expect(hung.mock.calls[0][1].signal).toBe(expired);
    expect(err).toBeInstanceOf(DOMException);
    expect(describeError(err).title).toBe('El servidor tardó demasiado');
    timeout.mockRestore();
  });

  it('en el servidor se identifica con FRONTEND_API_TOKEN (y nunca con uno vacío)', async () => {
    vi.resetModules();
    vi.stubEnv('FRONTEND_API_TOKEN', 't'.repeat(40));
    const fetchMock = vi.fn(() => Promise.resolve(json({ data: [] })));
    vi.stubGlobal('fetch', fetchMock);
    const { apiFetch: fresh } = await import('@/lib/api');
    await fresh('/universities');
    expect(headersOf(fetchMock, 0)['X-Frontend-Token']).toBe('t'.repeat(40));

    vi.resetModules();
    vi.stubEnv('FRONTEND_API_TOKEN', '');
    const { apiFetch: withoutToken } = await import('@/lib/api');
    await withoutToken('/universities');
    expect(headersOf(fetchMock, 1)).not.toHaveProperty('X-Frontend-Token');
  });
});
