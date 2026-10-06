import type { Core } from '@strapi/strapi';

/**
 * Etiquetas, ayudas y columnas del panel administrativo (auditoría de producción, A-10).
 *
 * Sin esto, el panel muestra el nombre técnico de cada campo ("institutionalEmail", "shortBio",
 * "infoUrl") sin ninguna explicación, y quienes cargan el contenido son editores de universidad,
 * no programadores. Como el rol y los permisos, el código es la fuente de verdad: se sincroniza en
 * cada arranque (un cambio hecho a mano en "Configurar la vista" se pierde al reiniciar).
 *
 * Los valores de las listas desplegables (Maestria, Hibrida, Reunion…) no llevan tilde porque son
 * los valores guardados en la base; el sitio los muestra con tilde (frontend/lib/format.ts).
 */
type FieldText = { label: string; description?: string; placeholder?: string };

type PanelConfig = {
  fields: Record<string, FieldText>;
  /** Columnas de la tabla del listado, en orden */
  list?: string[];
  /** Campo con el que se muestra un registro al elegirlo en una relación */
  mainField?: string;
};

const IMAGE_RULES = 'PNG, JPG o WebP de hasta 5 MB.';
const URL_RULE = 'Dirección completa, empezando con https://';
const RICH_TEXT = 'Admite negritas, listas y enlaces (barra de herramientas).';

const SYSTEM_FIELDS: Record<string, FieldText> = {
  id: { label: 'ID' },
  documentId: { label: 'Identificador' },
  createdAt: { label: 'Creado' },
  updatedAt: { label: 'Última modificación' },
  publishedAt: { label: 'Publicado' },
  createdBy: { label: 'Creado por' },
  updatedBy: { label: 'Modificado por' },
};

export const PANEL_LABELS: Record<string, PanelConfig> = {
  'api::university.university': {
    mainField: 'name',
    list: ['displayOrder', 'acronym', 'name', 'website'],
    fields: {
      name: {
        label: 'Nombre oficial',
        description: 'Nombre completo, tal como debe aparecer en el sitio.',
        placeholder: 'Universidad de San Carlos de Guatemala',
      },
      acronym: {
        label: 'Siglas',
        description:
          'El sitio usa las siglas para pintar el perfil con los colores de la universidad: no las cambie sin avisar al equipo técnico.',
        placeholder: 'USAC',
      },
      displayOrder: {
        label: 'Orden en el sitio',
        description: 'Posición en las listas del sitio: 1 aparece primero.',
      },
      shortDescription: {
        label: 'Descripción breve',
        description: 'Presentación de la universidad en su perfil. Máximo 500 caracteres.',
      },
      logo: {
        label: 'Logotipo',
        description: `Logotipo oficial, de preferencia con fondo transparente o blanco y al menos 400 px de ancho. ${IMAGE_RULES}`,
      },
      website: {
        label: 'Sitio web',
        description: URL_RULE,
        placeholder: 'https://www.usac.edu.gt',
      },
      joinedForumAt: {
        label: 'Ingreso al Foro',
        description: 'Fecha en que la universidad se incorporó al Foro (aparece en su perfil).',
      },
      representatives: { label: 'Representantes', description: 'Se cargan en «Representante».' },
      academicPrograms: {
        label: 'Programas de posgrado',
        description: 'Se cargan en «Programa académico».',
      },
      activities: { label: 'Actividades', description: 'Se cargan en «Actividad».' },
    },
  },

  'api::representative.representative': {
    mainField: 'fullName',
    list: ['fullName', 'position', 'university', 'institutionalEmail'],
    fields: {
      fullName: {
        label: 'Nombre completo',
        description:
          'Nombre y apellidos, como deben aparecer en el sitio (puede incluir el título).',
        placeholder: 'Dra. Ana María López Pérez',
      },
      position: {
        label: 'Cargo',
        description: 'Cargo que ocupa en la universidad.',
        placeholder: 'Directora de la Escuela de Estudios de Postgrado',
      },
      institutionalEmail: {
        label: 'Correo institucional',
        description:
          'Se PUBLICA en el sitio para que el público le escriba. Use el correo de la universidad, nunca uno personal.',
        placeholder: 'nombre@universidad.edu.gt',
      },
      photo: {
        label: 'Fotografía',
        description: `Foto de rostro, cuadrada o vertical. Se publica en el sitio: solo con el permiso de la persona. ${IMAGE_RULES}`,
      },
      shortBio: {
        label: 'Reseña breve',
        description: 'Formación, área de trabajo y papel en el Foro. Máximo 800 caracteres.',
      },
      university: {
        label: 'Universidad',
        description: 'Si la deja vacía se asigna sola la universidad de su cuenta.',
      },
    },
  },

  'api::academic-program.academic-program': {
    mainField: 'name',
    list: ['name', 'level', 'modality', 'university'],
    fields: {
      name: {
        label: 'Nombre del programa',
        description: 'Nombre oficial, sin el nombre de la universidad.',
        placeholder: 'Maestría en Administración Pública',
      },
      level: { label: 'Grado', description: 'Maestría, Doctorado, Especialización o Diplomado.' },
      modality: { label: 'Modalidad', description: 'Presencial, Virtual o Híbrida.' },
      duration: {
        label: 'Duración',
        description: 'Texto libre, máximo 100 caracteres.',
        placeholder: '2 años (4 semestres)',
      },
      description: {
        label: 'Descripción',
        description: `A quién va dirigido, requisitos de ingreso, horario y lo esencial del plan de estudios. ${RICH_TEXT}`,
      },
      infoUrl: {
        label: 'Enlace oficial del programa',
        description: `Página del programa en el sitio de la universidad (el botón «Más información» lleva aquí). ${URL_RULE}`,
        placeholder: 'https://',
      },
      university: {
        label: 'Universidad',
        description: 'Si la deja vacía se asigna sola la universidad de su cuenta.',
      },
    },
  },

  'api::activity.activity': {
    mainField: 'title',
    list: ['date', 'title', 'type', 'participatingUniversities'],
    fields: {
      title: { label: 'Título', placeholder: 'Encuentro anual de directores de posgrado' },
      type: {
        label: 'Tipo',
        description: 'Encuentro, Conferencia, Seminario, Reunión o Proyecto.',
      },
      date: {
        label: 'Fecha',
        description: 'Día de la actividad; si dura varios días, el de inicio.',
      },
      description: {
        label: 'Descripción',
        description: `Qué se hizo o se hará, sede, horario y cómo participar. ${RICH_TEXT}`,
      },
      coverImage: { label: 'Imagen de portada', description: `Foto horizontal. ${IMAGE_RULES}` },
      participatingUniversities: {
        label: 'Universidades participantes',
        description:
          'Su universidad se agrega sola. Puede agregar otras; quitar una solo lo puede hacer el Super Admin.',
      },
      contributions: { label: 'Aportes relacionados' },
      galleryItems: { label: 'Fotos y videos', description: 'Se cargan en «Elemento de galería».' },
    },
  },

  'api::contribution.contribution': {
    mainField: 'title',
    list: ['publishedOn', 'title', 'type', 'relatedActivity'],
    fields: {
      title: { label: 'Título' },
      description: { label: 'Descripción', description: RICH_TEXT },
      type: { label: 'Tipo', description: 'Resultado, Iniciativa o Beneficio.' },
      publishedOn: { label: 'Fecha', description: 'Fecha del resultado o del anuncio.' },
      relatedActivity: { label: 'Actividad relacionada', description: 'Opcional.' },
    },
  },

  'api::news.news': {
    mainField: 'title',
    list: ['title', 'summary', 'publishedAt'],
    fields: {
      title: { label: 'Título' },
      summary: {
        label: 'Resumen',
        description:
          'Una o dos oraciones. Aparece en la lista de noticias, en Google y al compartir en redes. Máximo 300 caracteres.',
      },
      content: { label: 'Contenido', description: RICH_TEXT },
      coverImage: { label: 'Imagen de portada', description: `Foto horizontal. ${IMAGE_RULES}` },
    },
  },

  'api::gallery-item.gallery-item': {
    mainField: 'title',
    list: ['date', 'title', 'type', 'relatedActivity'],
    fields: {
      title: { label: 'Título', description: 'Breve descripción de la foto o el video.' },
      type: {
        label: 'Tipo',
        description:
          'Foto: suba la imagen en «Archivo». Video: pegue el enlace en «Enlace del video».',
      },
      file: { label: 'Archivo (foto)', description: IMAGE_RULES },
      videoUrl: {
        label: 'Enlace del video',
        description: `Enlace de YouTube o Vimeo. ${URL_RULE}`,
        placeholder: 'https://www.youtube.com/watch?v=…',
      },
      date: { label: 'Fecha' },
      relatedActivity: { label: 'Actividad', description: 'Opcional: la actividad donde se tomó.' },
    },
  },

  'api::editor-profile.editor-profile': {
    list: ['adminUser', 'university', 'notes'],
    fields: {
      adminUser: {
        label: 'Usuario del panel',
        description:
          'Cuenta que editará (se invita en Configuración → Usuarios con el rol «Editor de Universidad»).',
      },
      university: {
        label: 'Universidad que puede editar',
        description: 'Una sola: quien edite dos universidades necesita dos cuentas.',
      },
      notes: { label: 'Notas internas', description: 'No se publican.' },
    },
  },

  'api::contact-message.contact-message': {
    mainField: 'subject',
    list: ['createdAt', 'name', 'email', 'subject', 'handled'],
    fields: {
      name: { label: 'Nombre' },
      email: { label: 'Correo', description: 'Para responder, escriba a esta dirección.' },
      subject: { label: 'Asunto' },
      message: { label: 'Mensaje' },
      handled: {
        label: 'Atendido',
        description:
          'Márquelo al responder. Los mensajes se borran solos al cumplirse el plazo del aviso de privacidad.',
      },
    },
  },

  'api::audit-log.audit-log': {
    list: ['createdAt', 'adminUserEmail', 'action', 'contentType', 'summary'],
    fields: {
      adminUserId: { label: 'ID del usuario' },
      adminUserEmail: { label: 'Usuario' },
      action: { label: 'Acción' },
      contentType: { label: 'Tipo de contenido' },
      targetDocumentId: { label: 'Registro afectado' },
      summary: { label: 'Resumen' },
      ipAddress: { label: 'Dirección IP' },
      statusCode: { label: 'Código de respuesta' },
    },
  },
};

type Metadata = { edit?: Record<string, unknown>; list?: Record<string, unknown> };
type Configuration = {
  settings: Record<string, unknown>;
  metadatas: Record<string, Metadata>;
  layouts: { list: string[]; edit: unknown };
};

/** Configuración nueva, o null si ya coincide con la del código. */
export function applyPanelConfig(
  current: Configuration,
  config: PanelConfig
): Configuration | null {
  const metadatas: Record<string, Metadata> = { ...current.metadatas };
  const texts = { ...SYSTEM_FIELDS, ...config.fields };

  for (const [field, text] of Object.entries(texts)) {
    const meta = metadatas[field];
    if (!meta) continue;
    metadatas[field] = {
      ...meta,
      ...(meta.edit
        ? {
            edit: {
              ...meta.edit,
              label: text.label,
              description: text.description ?? '',
              placeholder: text.placeholder ?? '',
            },
          }
        : {}),
      ...(meta.list ? { list: { ...meta.list, label: text.label } } : {}),
    };
  }

  const list = config.list?.filter((field) => field in metadatas);
  const next: Configuration = {
    settings: config.mainField
      ? { ...current.settings, mainField: config.mainField }
      : current.settings,
    metadatas,
    layouts: list?.length ? { ...current.layouts, list } : current.layouts,
  };

  const same =
    JSON.stringify(next.settings) === JSON.stringify(current.settings) &&
    JSON.stringify(next.metadatas) === JSON.stringify(current.metadatas) &&
    JSON.stringify(next.layouts) === JSON.stringify(current.layouts);
  return same ? null : next;
}

export async function ensurePanelLabels(strapi: Core.Strapi): Promise<void> {
  const service = strapi.plugin('content-manager').service('content-types');
  const contentTypes = strapi.contentTypes as unknown as Record<string, { uid: string }>;
  let updated = 0;

  for (const [uid, config] of Object.entries(PANEL_LABELS)) {
    const contentType = contentTypes[uid];
    if (!contentType) continue;
    const current = (await service.findConfiguration(contentType)) as Configuration;
    const next = applyPanelConfig(current, config);
    if (!next) continue;
    await service.updateConfiguration(contentType, next);
    updated += 1;
  }

  if (updated > 0)
    strapi.log.info(`[panel] etiquetas en español sincronizadas en ${updated} tipos`);
}
