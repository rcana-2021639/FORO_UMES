/**
 * Vida del Foro, de simulación: actividades 2019–2027, aportes, noticias y galería.
 * Los hechos son inventados pero verosímiles; las siglas de universidades son las reales.
 */
import type { PhotoKey } from './media';

type Acr = 'USAC' | 'URL' | 'UVG' | 'UMG' | 'UNIS' | 'UPANA' | 'UMES' | 'Galileo' | 'UNI';
export const ALL: Acr[] = ['USAC', 'URL', 'UVG', 'UMG', 'UNIS', 'UPANA', 'UMES', 'Galileo', 'UNI'];

export interface SeedActivity {
  key: string;
  title: string;
  type: 'Encuentro' | 'Conferencia' | 'Seminario' | 'Reunion' | 'Proyecto';
  date: string;
  unis: Acr[];
  cover?: PhotoKey;
  /** Sede (va en la descripción). */
  place: string;
  description: string;
}

export const ACTIVITIES: SeedActivity[] = [
  {
    key: 'encuentro-2019',
    title: 'Primer Encuentro Interuniversitario de Directores de Posgrado',
    type: 'Encuentro',
    date: '2019-05-16',
    unis: ['USAC', 'URL', 'UVG', 'UMG', 'UNIS', 'UPANA', 'UMES', 'Galileo'],
    cover: 'usac-antigua',
    place: 'Antiguo edificio de la Universidad de San Carlos, Antigua Guatemala',
    description:
      'Las direcciones de posgrado se reunieron por primera vez con una agenda común: conocer la oferta de cada universidad, identificar programas complementarios y acordar una forma de trabajo permanente.\n\n**Acuerdos principales**\n\n- Sesionar dos veces al año, con sede rotativa.\n- Compartir un calendario académico de posgrado.\n- Crear comisiones de investigación, calidad y movilidad.',
  },
  {
    key: 'seminario-metodologia-2019',
    title: 'Seminario de Metodología de la Investigación en Posgrado',
    type: 'Seminario',
    date: '2019-09-12',
    unis: ['USAC', 'URL', 'UVG', 'Galileo'],
    cover: 'seminario',
    place: 'Campus Central, Universidad Rafael Landívar',
    description:
      'Dos jornadas de trabajo para docentes asesores de tesis de maestría y doctorado. Se compararon los lineamientos de cada universidad para protocolos de investigación y se propuso una guía común de evaluación.\n\n**Participaron** 64 asesores de tesis de cuatro universidades.',
  },
  {
    key: 'reunion-calendario-2020',
    title: 'Reunión de coordinación de calendarios académicos',
    type: 'Reunion',
    date: '2020-02-20',
    unis: ['USAC', 'URL', 'UVG', 'UMG', 'UNIS', 'UPANA', 'UMES', 'Galileo'],
    place: 'Rectoría de la Universidad Mariano Gálvez, zona 2',
    description:
      'Se armonizaron las fechas de inscripción y de inicio de ciclo de los programas de posgrado para facilitar que un estudiante curse asignaturas en otra universidad del Foro.',
  },
  {
    key: 'conferencia-pandemia-2020',
    title: 'Conferencia virtual: el posgrado frente a la pandemia',
    type: 'Conferencia',
    date: '2020-07-09',
    unis: ['USAC', 'URL', 'UVG', 'UMG', 'UNIS', 'UPANA', 'UMES', 'Galileo'],
    cover: 'auditorio',
    place: 'Transmisión en línea',
    description:
      'Conferencia transmitida en línea sobre la migración de los programas de posgrado a entornos virtuales durante la emergencia sanitaria. Cada universidad presentó su experiencia y los retos de evaluación a distancia.\n\n**Asistencia:** más de 1 200 conexiones simultáneas.',
  },
  {
    key: 'repositorio-2020',
    title: 'Repositorio Interuniversitario de Tesis de Posgrado',
    type: 'Proyecto',
    date: '2020-11-19',
    unis: ['USAC', 'URL', 'UVG', 'Galileo', 'UMG'],
    cover: 'biblioteca-1',
    place: 'Proyecto conjunto',
    description:
      'Proyecto para reunir en un solo catálogo las tesis de maestría y doctorado de las universidades participantes, con metadatos comunes y acceso abierto cuando el autor lo autoriza.\n\n**Primera fase:** 3 400 tesis catalogadas.',
  },
  {
    key: 'seminario-etica-2021',
    title: 'Seminario de Ética en la Investigación Científica',
    type: 'Seminario',
    date: '2021-04-22',
    unis: ['USAC', 'UVG', 'UNIS', 'UMG'],
    cover: 'conferencia-3',
    place: 'Modalidad híbrida, Universidad del Valle de Guatemala',
    description:
      'Seminario sobre consentimiento informado, integridad académica y comités de ética. Se presentó un modelo de reglamento que cada universidad puede adaptar.',
  },
  {
    key: 'encuentro-2021',
    title: 'II Encuentro del Foro: calidad y acreditación de programas',
    type: 'Encuentro',
    date: '2021-08-26',
    unis: ['USAC', 'URL', 'UVG', 'UMG', 'UNIS', 'UPANA', 'UMES', 'Galileo'],
    cover: 'panel-1',
    place: 'Universidad del Valle de Guatemala, zona 15',
    description:
      'Segundo encuentro anual, dedicado a la autoevaluación y acreditación de programas de posgrado. Participaron agencias acreditadoras de la región y se definieron indicadores comunes de calidad.',
  },
  {
    key: 'conferencia-ciencia-abierta-2021',
    title: 'Ciencia abierta y publicación académica',
    type: 'Conferencia',
    date: '2021-10-28',
    unis: ['URL', 'Galileo', 'UNIS'],
    cover: 'conferencia-1',
    place: 'Auditorio de la Universidad Galileo, zona 10',
    description:
      'Conferencia sobre revistas de acceso abierto, repositorios institucionales y derechos de autor en la publicación de resultados de tesis.',
  },
  {
    key: 'movilidad-2022',
    title: 'Programa de Movilidad Docente Interuniversitaria',
    type: 'Proyecto',
    date: '2022-03-17',
    unis: ['USAC', 'URL', 'UVG', 'UMG', 'UMES', 'Galileo'],
    cover: 'url-campus',
    place: 'Proyecto conjunto',
    description:
      'Programa que permite a docentes de posgrado impartir cursos o seminarios en otra universidad del Foro durante un ciclo, con reconocimiento en su carga académica.\n\n**Primera convocatoria:** 22 docentes en movilidad.',
  },
  {
    key: 'seminario-innovacion-2022',
    title: 'Seminario de Innovación Educativa y Entornos Virtuales',
    type: 'Seminario',
    date: '2022-06-09',
    unis: ['Galileo', 'UMES', 'UPANA'],
    cover: 'galileo-aulas',
    place: 'Universidad Galileo, Instituto Von Neumann',
    description:
      'Encuentro de coordinadores de programas en línea para compartir buenas prácticas de diseño instruccional, tutoría virtual y evaluación en plataformas.',
  },
  {
    key: 'encuentro-2022',
    title: 'III Encuentro del Foro en Antigua Guatemala',
    type: 'Encuentro',
    date: '2022-10-13',
    unis: ['USAC', 'URL', 'UVG', 'UMG', 'UNIS', 'UPANA', 'UMES', 'Galileo'],
    cover: 'antigua-arco',
    place: 'Antigua Guatemala, Sacatepéquez',
    description:
      'Tercer encuentro anual. Se aprobó el reglamento de reconocimiento de créditos entre universidades y se presentó el informe del repositorio de tesis.',
  },
  {
    key: 'reunion-agenda-2023',
    title: 'Reunión de autoridades: agenda de trabajo 2023',
    type: 'Reunion',
    date: '2023-02-23',
    unis: ['USAC', 'URL', 'UVG', 'UMG', 'UNIS', 'UPANA', 'UMES', 'Galileo'],
    place: 'Universidad del Istmo, zona 10',
    description:
      'Sesión ordinaria para fijar las prioridades del año: observatorio de egresados, formación de asesores de tesis y una feria conjunta de posgrados.',
  },
  {
    key: 'congreso-2023',
    title: 'Congreso Centroamericano de Estudios de Posgrado',
    type: 'Conferencia',
    date: '2023-05-18',
    unis: ['USAC', 'URL', 'UVG', 'UMG', 'UNIS', 'UPANA', 'UMES', 'Galileo'],
    cover: 'conferencia-2',
    place: 'Ciudad de Guatemala',
    description:
      'Congreso regional con ponentes de El Salvador, Honduras, Costa Rica y Panamá. Tres días de conferencias magistrales, mesas de trabajo y presentación de avances de tesis doctorales.\n\n**Ponencias presentadas:** 86.',
  },
  {
    key: 'observatorio-2023',
    title: 'Observatorio de Empleabilidad de Egresados de Posgrado',
    type: 'Proyecto',
    date: '2023-09-07',
    unis: ['UVG', 'URL', 'Galileo', 'UNIS'],
    cover: 'guate-panorama',
    place: 'Proyecto conjunto',
    description:
      'Encuesta anual y tablero de datos sobre la inserción laboral de quienes egresan de maestrías y doctorados: sector, salario de referencia y pertinencia del programa.',
  },
  {
    key: 'seminario-ia-2024',
    title: 'Seminario de Inteligencia Artificial en la Investigación',
    type: 'Seminario',
    date: '2024-03-14',
    unis: ['Galileo', 'UVG', 'URL', 'USAC'],
    cover: 'galileo-campus',
    place: 'Universidad Galileo, zona 10',
    description:
      'Uso responsable de herramientas de inteligencia artificial en la revisión de literatura, el análisis de datos y la redacción académica. Se acordó una declaración de principios común.',
  },
  {
    key: 'encuentro-2024',
    title: 'IV Encuentro del Foro en Quetzaltenango',
    type: 'Encuentro',
    date: '2024-06-20',
    unis: ['USAC', 'URL', 'UVG', 'UMG', 'UNIS', 'UPANA', 'UMES', 'Galileo'],
    cover: 'xela-parque',
    place: 'Universidad Mesoamericana, sede Quetzaltenango',
    description:
      'Primer encuentro anual fuera de la capital, organizado por la Universidad Mesoamericana. El tema central fue la descentralización de la oferta de posgrado hacia el occidente del país.',
  },
  {
    key: 'jornada-2024',
    title: 'Jornada de Divulgación Científica de Posgrado',
    type: 'Conferencia',
    date: '2024-09-26',
    unis: ['USAC', 'UMG', 'UPANA', 'UMES'],
    cover: 'usac-biblioteca',
    place: 'Ciudad Universitaria, zona 12',
    description:
      'Estudiantes de maestría y doctorado presentaron sus investigaciones en formato de charla breve ante público general. Se premiaron las tres mejores exposiciones.',
  },
  {
    key: 'reunion-creditos-2025',
    title: 'Reunión técnica sobre reconocimiento de créditos',
    type: 'Reunion',
    date: '2025-02-27',
    unis: ['USAC', 'URL', 'UVG', 'UMG', 'UNIS', 'UPANA', 'UMES', 'Galileo', 'UNI'],
    place: 'Universidad Rafael Landívar, zona 16',
    description:
      'Registros académicos de las nueve universidades revisaron el procedimiento de equivalencias para cursos tomados en otra institución del Foro.',
  },
  {
    key: 'red-tutores-2025',
    title: 'Red de Tutores de Tesis Doctorales',
    type: 'Proyecto',
    date: '2025-05-22',
    unis: ['USAC', 'URL', 'UMG', 'Galileo', 'UNIS'],
    cover: 'biblioteca-2',
    place: 'Proyecto conjunto',
    description:
      'Directorio compartido de tutores con doctorado y líneas de investigación activas, para que los doctorandos puedan tener codirección de otra universidad.\n\n**Tutores registrados:** 140.',
  },
  {
    key: 'seminario-redaccion-2025',
    title: 'Seminario de Redacción Científica y Publicación en Revistas Indexadas',
    type: 'Seminario',
    date: '2025-08-14',
    unis: ['UVG', 'UNI', 'UPANA', 'UMES'],
    cover: 'seminario',
    place: 'Modalidad virtual',
    description:
      'Taller práctico de cuatro sesiones sobre estructura IMRyD, elección de revista, respuesta a revisores y ética de autoría.',
  },
  {
    key: 'encuentro-2025',
    title: 'Encuentro Anual del Foro 2025',
    type: 'Encuentro',
    date: '2025-10-15',
    unis: ALL,
    cover: 'panel-2',
    place: 'Universidad Mariano Gálvez, campus central',
    description:
      'Encuentro anual con la participación de las nueve universidades, tras la incorporación de la Universidad InterNaciones. Se presentó la plataforma pública del Foro y la agenda 2026.',
  },
  {
    key: 'conferencia-territorio-2026',
    title: 'Conferencia: posgrado y desarrollo territorial',
    type: 'Conferencia',
    date: '2026-03-19',
    unis: ['USAC', 'UMES', 'URL', 'UVG'],
    cover: 'umes-frente',
    place: 'Universidad Mesoamericana, Ciudad de Guatemala',
    description:
      'Cómo pueden los programas de maestría responder a las necesidades de los departamentos: agua, salud rural, gobiernos locales y economía comunitaria.',
  },
  {
    key: 'seminario-datos-2026',
    title: 'Seminario de Datos Abiertos para la Investigación',
    type: 'Seminario',
    date: '2026-06-11',
    unis: ['Galileo', 'UNI', 'UVG', 'UNIS'],
    cover: 'galileo-frente',
    place: 'Modalidad híbrida',
    description:
      'Fuentes de datos públicos de Guatemala, buenas prácticas de gestión de datos de investigación y planes de gestión de datos para tesis.',
  },
  {
    key: 'sesion-2026',
    title: 'Sesión ordinaria del Foro, segundo semestre',
    type: 'Reunion',
    date: '2026-08-27',
    unis: ALL,
    place: 'Universidad Panamericana, campus central',
    description: 'Seguimiento de los proyectos conjuntos y preparación del Encuentro Anual 2026.',
  },
  {
    key: 'encuentro-2026',
    title: 'Encuentro Anual del Foro 2026',
    type: 'Encuentro',
    date: '2026-10-22',
    unis: ALL,
    cover: 'url-capilla',
    place: 'Universidad Rafael Landívar, Campus Central',
    description:
      'Próximo encuentro anual. Temas: doble titulación entre universidades del Foro, observatorio de egresados y becas para docentes.\n\n**Inscripción** abierta para autoridades y coordinadores de posgrado.',
  },
  {
    key: 'feria-2026',
    title: 'Feria Interuniversitaria de Posgrados 2026',
    type: 'Conferencia',
    date: '2026-11-12',
    unis: ALL,
    cover: 'usac-campus',
    place: 'Ciudad Universitaria, zona 12',
    description:
      'Feria abierta al público: las nueve universidades presentan su oferta de maestrías, doctorados y especializaciones, con charlas sobre becas y financiamiento.',
  },
  {
    key: 'seminario-evaluacion-2027',
    title: 'Seminario de Evaluación de Programas de Posgrado',
    type: 'Seminario',
    date: '2027-02-18',
    unis: ['USAC', 'UVG', 'UMG', 'UPANA', 'UNI'],
    cover: 'conferencia-1',
    place: 'Universidad del Valle de Guatemala',
    description:
      'Seminario programado sobre indicadores de resultado, seguimiento de cohortes y evaluación externa de maestrías y doctorados.',
  },
];

export interface SeedContribution {
  title: string;
  type: 'Resultado' | 'Iniciativa' | 'Beneficio';
  publishedOn: string;
  activity?: string;
  description: string;
}

export const CONTRIBUTIONS: SeedContribution[] = [
  {
    title: 'Calendario común de posgrado',
    type: 'Resultado',
    publishedOn: '2020-03-02',
    activity: 'reunion-calendario-2020',
    description:
      'Las universidades publican un calendario compartido de inscripciones e inicio de ciclo. Ahora es posible planificar un curso en otra universidad sin perder el semestre.',
  },
  {
    title: 'Guía común para evaluar protocolos de tesis',
    type: 'Resultado',
    publishedOn: '2019-11-05',
    activity: 'seminario-metodologia-2019',
    description:
      'Rúbrica de evaluación de protocolos de investigación adoptada por cuatro universidades. Unifica criterios de pertinencia, rigor metodológico y viabilidad.',
  },
  {
    title: 'Catálogo abierto de tesis de posgrado',
    type: 'Beneficio',
    publishedOn: '2021-06-15',
    activity: 'repositorio-2020',
    description:
      'Estudiantes e investigadores consultan en un solo lugar más de 3 400 tesis de maestría y doctorado, con acceso abierto cuando el autor lo autorizó.',
  },
  {
    title: 'Modelo de reglamento de ética en investigación',
    type: 'Resultado',
    publishedOn: '2021-05-20',
    activity: 'seminario-etica-2021',
    description:
      'Documento base que cada universidad adapta para crear o actualizar su comité de ética de investigación en posgrado.',
  },
  {
    title: 'Indicadores comunes de calidad de programas',
    type: 'Resultado',
    publishedOn: '2021-10-04',
    activity: 'encuentro-2021',
    description:
      'Veinte indicadores acordados —tasa de graduación, tiempo de titulación, producción científica, entre otros— para la autoevaluación de maestrías y doctorados.',
  },
  {
    title: 'Movilidad docente entre universidades',
    type: 'Beneficio',
    publishedOn: '2022-08-01',
    activity: 'movilidad-2022',
    description:
      'Veintidós docentes impartieron cursos en otra universidad del Foro durante el primer año. Los estudiantes acceden a especialistas que su universidad no tiene.',
  },
  {
    title: 'Reconocimiento mutuo de créditos',
    type: 'Resultado',
    publishedOn: '2022-11-01',
    activity: 'encuentro-2022',
    description:
      'Reglamento aprobado por las universidades del Foro: hasta el 20 % de los créditos de una maestría puede cursarse en otra institución integrante.',
  },
  {
    title: 'Formación conjunta de asesores de tesis',
    type: 'Iniciativa',
    publishedOn: '2023-03-10',
    activity: 'reunion-agenda-2023',
    description:
      'Programa de formación para docentes que asesoran tesis de posgrado, con módulos compartidos entre universidades.',
  },
  {
    title: 'Tablero de empleabilidad de egresados',
    type: 'Beneficio',
    publishedOn: '2024-02-12',
    activity: 'observatorio-2023',
    description:
      'Datos abiertos sobre la inserción laboral de egresados de posgrado, útiles para quien decide qué estudiar y para quien diseña programas.',
  },
  {
    title: 'Declaración sobre el uso de inteligencia artificial en la investigación',
    type: 'Resultado',
    publishedOn: '2024-04-02',
    activity: 'seminario-ia-2024',
    description:
      'Principios compartidos para el uso transparente y responsable de herramientas de IA en tesis de maestría y doctorado.',
  },
  {
    title: 'Oferta de posgrado en el occidente del país',
    type: 'Iniciativa',
    publishedOn: '2024-07-15',
    activity: 'encuentro-2024',
    description:
      'Compromiso de ampliar programas semipresenciales en Quetzaltenango, San Marcos y Totonicapán con docentes de varias universidades.',
  },
  {
    title: 'Codirección de tesis doctorales entre universidades',
    type: 'Beneficio',
    publishedOn: '2025-07-01',
    activity: 'red-tutores-2025',
    description:
      'Los doctorandos pueden sumar un codirector de otra universidad del Foro. En el primer semestre se registraron 31 codirecciones.',
  },
  {
    title: 'Becas de posgrado para docentes universitarios',
    type: 'Iniciativa',
    publishedOn: '2025-11-03',
    activity: 'encuentro-2025',
    description:
      'Fondo común para que docentes de una universidad cursen maestrías en otra, con prioridad para áreas con pocos especialistas.',
  },
  {
    title: 'Plataforma pública del Foro',
    type: 'Beneficio',
    publishedOn: '2025-10-20',
    activity: 'encuentro-2025',
    description:
      'Este sitio: la oferta de posgrado de las nueve universidades, sus representantes y las actividades del Foro, en un solo lugar.',
  },
];

export interface SeedNews {
  title: string;
  summary: string;
  date: string;
  cover?: PhotoKey;
  content: string;
}

export const NEWS: SeedNews[] = [
  {
    title: 'Abierta la inscripción al Encuentro Anual del Foro 2026',
    summary:
      'El encuentro será el 22 de octubre en el Campus Central de la Landívar. La doble titulación entre universidades encabeza la agenda.',
    date: '2026-09-18',
    cover: 'url-capilla',
    content:
      'El Foro Interuniversitario de Estudios de Posgrado abrió la inscripción para su **Encuentro Anual 2026**, que se realizará el jueves 22 de octubre en el Campus Central de la Universidad Rafael Landívar.\n\n## Agenda\n\n- **Doble titulación:** propuesta de un marco común para programas conjuntos entre dos o más universidades del Foro.\n- **Observatorio de egresados:** resultados de la tercera encuesta de empleabilidad.\n- **Becas para docentes:** balance del primer año del fondo común.\n\n## ¿Quién puede participar?\n\nAutoridades, directores y coordinadores de posgrado de las nueve universidades integrantes. Habrá una sesión abierta al público por la tarde.\n\n> «Queremos que un estudiante pueda construir su trayectoria de posgrado con lo mejor de cada universidad», explicó la coordinación del Foro.',
  },
  {
    title: 'La Feria Interuniversitaria de Posgrados llega a la Ciudad Universitaria',
    summary:
      'El 12 de noviembre, las nueve universidades presentarán su oferta de maestrías y doctorados en un solo lugar, con charlas sobre becas.',
    date: '2026-09-02',
    cover: 'usac-campus',
    content:
      'Por primera vez, las nueve universidades del Foro presentarán juntas su oferta de posgrado en una feria abierta al público.\n\n## Qué habrá\n\n- Espacios de cada universidad con asesoría personalizada.\n- Charlas sobre financiamiento, becas y créditos educativos.\n- Presentaciones de egresados de maestría y doctorado.\n\nLa entrada es libre. La feria se realizará en la Ciudad Universitaria, zona 12, de 9:00 a 17:00 horas.',
  },
  {
    title: 'Datos abiertos para la investigación: lo que dejó el seminario de junio',
    summary:
      'Cuatro universidades compartieron fuentes de datos públicos y un modelo de plan de gestión de datos para tesis.',
    date: '2026-06-24',
    cover: 'galileo-frente',
    content:
      'El **Seminario de Datos Abiertos para la Investigación** reunió a coordinadores y estudiantes de Galileo, InterNaciones, UVG y UNIS.\n\nEntre los resultados está un **modelo de plan de gestión de datos** que los programas pueden exigir desde el protocolo de tesis, y un listado curado de fuentes públicas guatemaltecas: estadísticas nacionales, presupuesto, salud y clima.\n\nLas presentaciones están disponibles para las universidades integrantes.',
  },
  {
    title: 'El posgrado mira a los departamentos',
    summary:
      'En la conferencia de marzo se presentaron maestrías que investigan agua, salud rural y gobiernos locales fuera de la capital.',
    date: '2026-03-26',
    cover: 'xela-parque',
    content:
      'La conferencia **Posgrado y desarrollo territorial** mostró cómo varias maestrías ya investigan problemas concretos de los departamentos.\n\n- Calidad del agua en municipios del altiplano.\n- Atención primaria en salud rural.\n- Planificación en gobiernos locales.\n\nLas universidades acordaron identificar las tesis con enfoque territorial dentro del repositorio común.',
  },
  {
    title: 'La Universidad InterNaciones se integra al Foro',
    summary:
      'Con su incorporación, el Foro reúne a nueve universidades y suma más de cuarenta maestrías en línea.',
    date: '2025-10-16',
    cover: 'participantes',
    content:
      'Durante el Encuentro Anual 2025, el Foro dio la bienvenida formal a la **Universidad InterNaciones**, institución de educación superior en línea.\n\nSu incorporación amplía la oferta virtual del Foro con maestrías en inteligencia artificial, ciberseguridad, big data, finanzas públicas y educación, y un programa de becas amplias para colectivos vulnerables.\n\nCon esta integración, el Foro reúne a **nueve universidades** del país.',
  },
  {
    title: 'Se presenta la plataforma pública del Foro',
    summary:
      'La oferta de posgrado de las nueve universidades, sus representantes y las actividades del Foro, ahora en un solo sitio.',
    date: '2025-10-20',
    cover: 'panel-2',
    content:
      'El Foro presentó su **plataforma pública**, donde cualquier persona puede consultar la oferta de posgrado de las nueve universidades, filtrar por nivel y modalidad y conocer a quienes representan a cada institución.\n\nCada universidad administra su propia información desde un panel con permisos por institución, y el Foro publica las noticias y actividades conjuntas.',
  },
  {
    title: 'Treinta y una codirecciones de tesis doctoral en el primer semestre',
    summary:
      'La Red de Tutores permite que un doctorando tenga un codirector de otra universidad del Foro.',
    date: '2025-07-03',
    cover: 'biblioteca-2',
    content:
      'A seis meses de su lanzamiento, la **Red de Tutores de Tesis Doctorales** registra 140 tutores y 31 codirecciones entre universidades.\n\nLas áreas con más codirecciones son educación, salud pública y derecho.',
  },
  {
    title: 'Principios comunes para el uso de inteligencia artificial en tesis',
    summary:
      'Las universidades del Foro acordaron una declaración sobre el uso transparente de herramientas de IA en la investigación de posgrado.',
    date: '2024-04-04',
    cover: 'galileo-campus',
    content:
      'Tras el **Seminario de Inteligencia Artificial en la Investigación**, las universidades del Foro firmaron una declaración de principios:\n\n1. Declarar siempre el uso de herramientas de IA.\n2. La autoría y la responsabilidad son de la persona investigadora.\n3. Los datos personales no se comparten con servicios externos.\n4. Cada programa define qué usos son aceptables en su disciplina.',
  },
  {
    title: 'Quetzaltenango recibe por primera vez el Encuentro del Foro',
    summary:
      'La Universidad Mesoamericana organizó el IV Encuentro, dedicado a llevar la oferta de posgrado al occidente del país.',
    date: '2024-06-21',
    cover: 'umes-edificio',
    content:
      'El **IV Encuentro del Foro** se realizó en la sede Quetzaltenango de la Universidad Mesoamericana, la primera vez fuera de la capital.\n\nLas universidades se comprometieron a ampliar los programas semipresenciales en el occidente, con docentes de varias instituciones.',
  },
  {
    title: 'Ochenta y seis ponencias en el Congreso Centroamericano de Posgrado',
    summary: 'Tres días de conferencias con investigadores de cinco países de la región.',
    date: '2023-05-22',
    cover: 'conferencia-2',
    content:
      'El **Congreso Centroamericano de Estudios de Posgrado** reunió a investigadores de Guatemala, El Salvador, Honduras, Costa Rica y Panamá.\n\nSe presentaron 86 ponencias y 24 avances de tesis doctorales. El próximo congreso se realizará en 2027.',
  },
  {
    title: 'Aprobado el reconocimiento mutuo de créditos',
    summary:
      'Hasta el 20 % de los créditos de una maestría podrá cursarse en otra universidad del Foro.',
    date: '2022-10-17',
    cover: 'antigua-arco-2',
    content:
      'En el III Encuentro, realizado en Antigua Guatemala, las universidades aprobaron el **reglamento de reconocimiento mutuo de créditos**.\n\nUn estudiante de maestría podrá cursar hasta el 20 % de sus créditos en otra universidad integrante, con equivalencia automática cuando los programas estén emparejados.',
  },
  {
    title: 'Graduación conjunta de la primera cohorte de movilidad',
    summary:
      'Estudiantes que cursaron parte de su maestría en otra universidad del Foro recibieron su título.',
    date: '2023-12-08',
    cover: 'graduacion-1',
    content:
      'La primera cohorte de estudiantes que aprovechó la movilidad entre universidades del Foro celebró su graduación.\n\nCuarenta y dos personas cursaron al menos un curso en otra institución integrante durante su maestría.',
  },
];

export interface SeedGalleryPhoto {
  photo: PhotoKey;
  title: string;
  date: string;
  activity?: string;
}

export const GALLERY_PHOTOS: SeedGalleryPhoto[] = [
  {
    photo: 'usac-antigua',
    title: 'Sede del Primer Encuentro de Directores de Posgrado',
    date: '2019-05-16',
    activity: 'encuentro-2019',
  },
  {
    photo: 'usac-antigua-2',
    title: 'Claustro del antiguo edificio universitario',
    date: '2019-05-16',
    activity: 'encuentro-2019',
  },
  {
    photo: 'seminario',
    title: 'Mesa de trabajo del seminario de metodología',
    date: '2019-09-12',
    activity: 'seminario-metodologia-2019',
  },
  {
    photo: 'biblioteca-1',
    title: 'Lanzamiento del repositorio de tesis',
    date: '2020-11-19',
    activity: 'repositorio-2020',
  },
  {
    photo: 'panel-1',
    title: 'Panel sobre acreditación de programas',
    date: '2021-08-26',
    activity: 'encuentro-2021',
  },
  {
    photo: 'conferencia-1',
    title: 'Conferencia sobre ciencia abierta',
    date: '2021-10-28',
    activity: 'conferencia-ciencia-abierta-2021',
  },
  {
    photo: 'url-campus',
    title: 'Campus Central de la Landívar, primera sede de movilidad',
    date: '2022-03-17',
    activity: 'movilidad-2022',
  },
  {
    photo: 'antigua-arco',
    title: 'Antigua Guatemala recibe el III Encuentro',
    date: '2022-10-13',
    activity: 'encuentro-2022',
  },
  {
    photo: 'antigua-arco-2',
    title: 'Recorrido de las delegaciones por Antigua',
    date: '2022-10-14',
    activity: 'encuentro-2022',
  },
  {
    photo: 'conferencia-2',
    title: 'Sesión plenaria del Congreso Centroamericano',
    date: '2023-05-18',
    activity: 'congreso-2023',
  },
  {
    photo: 'conferencia-3',
    title: 'Conferencia magistral del segundo día',
    date: '2023-05-19',
    activity: 'congreso-2023',
  },
  {
    photo: 'graduacion-1',
    title: 'Graduación de la primera cohorte de movilidad',
    date: '2023-12-08',
  },
  {
    photo: 'graduacion-2',
    title: 'Investidura de nuevos maestros y doctores',
    date: '2023-12-08',
  },
  {
    photo: 'graduacion-3',
    title: 'Entrega de títulos de posgrado',
    date: '2023-12-08',
  },
  {
    photo: 'galileo-campus',
    title: 'Seminario de inteligencia artificial en Galileo',
    date: '2024-03-14',
    activity: 'seminario-ia-2024',
  },
  {
    photo: 'xela-parque',
    title: 'Quetzaltenango, sede del IV Encuentro',
    date: '2024-06-20',
    activity: 'encuentro-2024',
  },
  {
    photo: 'umes-frente',
    title: 'Llegada de las delegaciones a la UMES Quetzaltenango',
    date: '2024-06-20',
    activity: 'encuentro-2024',
  },
  {
    photo: 'usac-biblioteca',
    title: 'Jornada de divulgación en la Biblioteca Central',
    date: '2024-09-26',
    activity: 'jornada-2024',
  },
  {
    photo: 'biblioteca-2',
    title: 'Reunión de la Red de Tutores',
    date: '2025-05-22',
    activity: 'red-tutores-2025',
  },
  {
    photo: 'panel-2',
    title: 'Panel inaugural del Encuentro Anual 2025',
    date: '2025-10-15',
    activity: 'encuentro-2025',
  },
  {
    photo: 'participantes',
    title: 'Delegaciones de las nueve universidades',
    date: '2025-10-15',
    activity: 'encuentro-2025',
  },
  {
    photo: 'umg-interior',
    title: 'Campus central de la UMG durante el Encuentro 2025',
    date: '2025-10-16',
    activity: 'encuentro-2025',
  },
  {
    photo: 'umes-aulas',
    title: 'Conferencia sobre desarrollo territorial',
    date: '2026-03-19',
    activity: 'conferencia-territorio-2026',
  },
  {
    photo: 'galileo-frente',
    title: 'Seminario de datos abiertos',
    date: '2026-06-11',
    activity: 'seminario-datos-2026',
  },
  {
    photo: 'guate-panorama-2',
    title: 'La Ciudad de Guatemala, sede de la mayoría de encuentros',
    date: '2026-08-27',
  },
];
