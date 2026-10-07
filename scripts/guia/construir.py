"""Convierte las capturas a WebP y genera public/guia/datos.js con los pasos (para guia.js)."""
import json, os
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, '.tmp', 'guia-capturas')
DEST = os.path.join(ROOT, 'public', 'guia')
os.makedirs(os.path.join(DEST, 'img'), exist_ok=True)

FLOWS = [
    ('entrar', 'Entrar al panel', 'Abrir el panel, iniciar sesión y conocer el menú.'),
    ('programa', 'Agregar un programa', 'Crear (o corregir) un programa de posgrado de tu universidad.'),
    ('representante', 'Tu representante', 'Actualizar los datos y la foto de quien representa a tu universidad.'),
    ('actividad', 'Proponer una actividad', 'Encuentros, seminarios y reuniones en los que participa tu universidad.'),
    ('noticia', 'Noticias y aportes', 'Escribir un borrador para que el Foro lo publique.'),
    ('fotos', 'Subir fotos', 'Agregar una imagen desde tu computadora o la biblioteca.'),
]

data = []
for key, title, lead in FLOWS:
    steps = json.load(open(os.path.join(SRC, f'steps-{key}.json'), encoding='utf-8'))
    for s in steps:
        im = Image.open(os.path.join(SRC, s['img'].replace('.webp', '.png'))).convert('RGB')
        im.save(os.path.join(DEST, 'img', s['img']), 'WEBP', quality=80, method=6)
        del s['flow']
    data.append({'id': key, 'title': title, 'lead': lead, 'steps': steps})

im = Image.open(os.path.join(SRC, 'sitio-01.png')).convert('RGB')
im.save(os.path.join(DEST, 'img', 'sitio-01.webp'), 'WEBP', quality=80, method=6)
site = json.load(open(os.path.join(SRC, 'sitio-boxes.json'), encoding='utf-8'))

js = '// Generado por la captura de la guía (no editar a mano): pasos, imágenes y recuadros.\n'
js += 'window.GUIA = ' + json.dumps({'flows': data, 'site': site}, ensure_ascii=False, indent=1) + ';\n'
open(os.path.join(DEST, 'datos.js'), 'w', encoding='utf-8', newline='').write(js)
total = sum(os.path.getsize(os.path.join(DEST, 'img', f)) for f in os.listdir(os.path.join(DEST, 'img')))
print('pasos', sum(len(f['steps']) for f in data), 'imagenes KB', total // 1024)
