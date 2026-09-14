import { checkImageSignature, detectImageMime } from '../../src/lib/image-signature';

const PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 73, 72, 68, 82,
]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70, 0, 1, 1, 0, 0, 1]);
const WEBP = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20,
]);
const EXE = new Uint8Array([0x4d, 0x5a, 0x90, 0, 3, 0, 0, 0, 4, 0, 0, 0, 0xff, 0xff, 0, 0]);

describe('detectImageMime', () => {
  it('reconoce PNG, JPEG y WebP por sus primeros bytes', () => {
    expect(detectImageMime(PNG)).toBe('image/png');
    expect(detectImageMime(JPEG)).toBe('image/jpeg');
    expect(detectImageMime(WEBP)).toBe('image/webp');
  });
  it('devuelve null para otros contenidos o archivos muy cortos', () => {
    expect(detectImageMime(EXE)).toBeNull();
    expect(detectImageMime(new Uint8Array([0x89, 0x50]))).toBeNull();
  });
});

describe('checkImageSignature', () => {
  it('acepta cuando bytes, MIME y extensión coinciden', () => {
    expect(checkImageSignature(PNG, 'image/png', 'logo.png')).toEqual({
      ok: true,
      mime: 'image/png',
    });
    expect(checkImageSignature(JPEG, 'IMAGE/JPEG', 'foto.JPG').ok).toBe(true);
    expect(checkImageSignature(WEBP, undefined, 'a.webp').ok).toBe(true);
  });
  it('rechaza un ejecutable renombrado como imagen', () => {
    const r = checkImageSignature(EXE, 'image/png', 'virus.png');
    expect(r.ok).toBe(false);
  });
  it('rechaza MIME declarado distinto al real', () => {
    const r = checkImageSignature(PNG, 'image/jpeg', 'a.png');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/no coincide/);
  });
  it('rechaza extensión que no corresponde', () => {
    const r = checkImageSignature(PNG, 'image/png', 'a.jpg');
    expect(r.ok).toBe(false);
    const r2 = checkImageSignature(PNG, 'image/png', 'sin-extension');
    expect(r2.ok).toBe(false);
  });
});
