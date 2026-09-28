/**
 * Fotografías de prueba: todas de Wikimedia Commons, con licencia libre (CC0, dominio público,
 * CC BY o CC BY-SA). El seed las descarga a `.tmp/seed-cache` y las sube a la biblioteca de
 * medios con el crédito en el texto alternativo y la leyenda, como piden las licencias BY/BY-SA.
 * Créditos completos en scripts/seed-data/CREDITOS.md.
 */
export interface SeedPhoto {
  /** Nombre exacto del archivo en Commons (sin "File:"). */
  file: string;
  alt: string;
  author: string;
  license: string;
}

export const PHOTOS = {
  // Universidad de San Carlos de Guatemala
  'usac-campus': {
    file: 'USAC - Guatemala City.jpg',
    alt: 'Ciudad Universitaria de la USAC, zona 12',
    author: 'tian2992',
    license: 'CC BY-SA 2.0',
  },
  'usac-biblioteca': {
    file: 'Biblioteca y Plaza.jpg',
    alt: 'Biblioteca Central y plaza de la Ciudad Universitaria',
    author: 'Sebastian Oliva',
    license: 'CC BY-SA 4.0',
  },
  'usac-t10': {
    file: 'Edificio T-10 USAC.jpg',
    alt: 'Edificio T-10 de la Ciudad Universitaria',
    author: 'Oscarin200',
    license: 'CC BY-SA 4.0',
  },
  'usac-recursos': {
    file: 'Recursos Educativos.jpg',
    alt: 'Edificio de Recursos Educativos de la USAC',
    author: 'Danilo Arredondo',
    license: 'CC BY-SA 3.0',
  },
  'usac-mural': {
    file: 'Mural USAC.JPG',
    alt: 'Mural en la Ciudad Universitaria',
    author: 'Fratticidio',
    license: 'CC BY 4.0',
  },
  'usac-antigua': {
    file: 'Universidad de San Carlos, Antigua Guatemala, in 2024 01.jpg',
    alt: 'Antiguo edificio de la Universidad de San Carlos en Antigua Guatemala',
    author: 'Nerdoguate',
    license: 'CC0',
  },
  'usac-antigua-2': {
    file: 'Universidad de San Carlos, Antigua Guatemala, in 2024 02.jpg',
    alt: 'Claustro del antiguo edificio universitario en Antigua Guatemala',
    author: 'Nerdoguate',
    license: 'CC0',
  },
  // Universidad Rafael Landívar
  'url-campus': {
    file: 'Landivar Campus Central.jpg',
    alt: 'Campus Central de la Universidad Rafael Landívar',
    author: 'MaCleDo',
    license: 'CC BY-SA 4.0',
  },
  'url-biblioteca': {
    file: 'Biblioteca Landivariana.jpg',
    alt: 'Biblioteca Landivariana',
    author: 'MaCleDo',
    license: 'CC BY-SA 4.0',
  },
  'url-capilla': {
    file: 'Capilla Santa Sofia.jpg',
    alt: 'Capilla Santa Sofía, Campus Central',
    author: 'MaCleDo',
    license: 'CC BY-SA 4.0',
  },
  'url-tec': {
    file: 'Edificio TEC URL.JPG',
    alt: 'Edificio de la Facultad de Ingeniería de la URL',
    author: 'Clau.mrossal',
    license: 'Dominio público',
  },
  // Universidad Mariano Gálvez
  'umg-edificio': {
    file: 'Edificio de Universidad Mariano Galvez.jpg',
    alt: 'Edificio central de la Universidad Mariano Gálvez',
    author: 'Lestrada',
    license: 'Dominio público',
  },
  'umg-aulas': {
    file: 'Edificio Aulas UMG.jpg',
    alt: 'Edificio de aulas de la UMG',
    author: 'Clau.mrossal',
    license: 'Dominio público',
  },
  'umg-interior': {
    file: 'Interior UMG.jpg',
    alt: 'Patio interior del campus central de la UMG',
    author: 'Lestrada',
    license: 'Dominio público',
  },
  // Universidad Galileo
  'galileo-campus': {
    file: 'Universidad Galileo.jpg',
    alt: 'Campus central de la Universidad Galileo',
    author: 'Oscarin200',
    license: 'CC BY-SA 4.0',
  },
  'galileo-frente': {
    file: 'Frente de la Universidad Galileo.jpg',
    alt: 'Fachada de la Universidad Galileo, zona 10',
    author: 'Lestrada',
    license: 'Dominio público',
  },
  'galileo-aulas': {
    file: 'AulasGalileo.jpg',
    alt: 'Edificio de aulas de la Universidad Galileo',
    author: 'Clau.mrossal',
    license: 'Dominio público',
  },
  // Universidad Mesoamericana
  'umes-frente': {
    file: 'Frente de Universidad Mesoamericana.JPG',
    alt: 'Fachada de la Universidad Mesoamericana',
    author: 'Lestrada',
    license: 'Dominio público',
  },
  'umes-edificio': {
    file: 'Edificio UMES.JPG',
    alt: 'Edificio de la Universidad Mesoamericana',
    author: 'Lestrada',
    license: 'Dominio público',
  },
  'umes-aulas': {
    file: 'Aulas UMES.JPG',
    alt: 'Aulas de la Universidad Mesoamericana',
    author: 'Lestrada',
    license: 'Dominio público',
  },
  // Ciudades
  'guate-panorama': {
    file: 'Panoramica ciudad de guatemala 08.JPG',
    alt: 'Vista panorámica de la Ciudad de Guatemala',
    author: 'Esanabria',
    license: 'Dominio público',
  },
  'guate-panorama-2': {
    file: 'Panoramica ciudad de guatemala 10.JPG',
    alt: 'La Ciudad de Guatemala al atardecer',
    author: 'Esanabria',
    license: 'Dominio público',
  },
  'antigua-arco': {
    file: 'Antigua Guatemala - Santa Catalina Arch.jpg',
    alt: 'Arco de Santa Catalina, Antigua Guatemala',
    author: 'Rene Hernandez',
    license: 'CC BY-SA 2.0',
  },
  'antigua-arco-2': {
    file: 'Arco de Santa Catalina Antigua Guatemala 1.jpg',
    alt: 'Calle del Arco con el Volcán de Agua al fondo',
    author: 'Adalberto H. Vega',
    license: 'CC BY 2.0',
  },
  'xela-parque': {
    file: 'QuetzaltenangoPCA.jpg',
    alt: 'Parque Centroamérica, Quetzaltenango',
    author: 'Infrogmation of New Orleans',
    license: 'Dominio público',
  },
  // Actos académicos
  'conferencia-1': {
    file: 'Conferencia de Ana María Cetto por el 50 aniversario de la UAA 05.jpg',
    alt: 'Conferencia magistral en un auditorio universitario',
    author: 'Luis Alvaz',
    license: 'CC BY-SA 4.0',
  },
  'conferencia-2': {
    file: 'Conferencia de Ana María Cetto por el 50 aniversario de la UAA 68.jpg',
    alt: 'Público en una conferencia académica',
    author: 'Luis Alvaz',
    license: 'CC BY-SA 4.0',
  },
  'conferencia-3': {
    file: 'Conferencia de Ana María Cetto por el 50 aniversario de la UAA 71.jpg',
    alt: 'Ponente frente al auditorio',
    author: 'Luis Alvaz',
    license: 'CC BY-SA 4.0',
  },
  'panel-1': {
    file: 'Panel Discussion at West-Japan Wikimedia Conference 1.jpg',
    alt: 'Mesa de panelistas en un encuentro académico',
    author: 'Aspere',
    license: 'CC0',
  },
  'panel-2': {
    file: 'Panel discussion at the day 1 of conference.jpg',
    alt: 'Panel de discusión durante la primera jornada de un congreso',
    author: 'Ishanjyotibora',
    license: 'CC BY-SA 4.0',
  },
  'graduacion-1': {
    file: 'Graduación 2014.JPG',
    alt: 'Ceremonia de graduación',
    author: 'AngelHM',
    license: 'CC BY-SA 4.0',
  },
  'graduacion-2': {
    file: 'Graduación Traducción e Interpretación - Inglés (41207504870).jpg',
    alt: 'Graduandos durante el acto de investidura',
    author: 'Universidad Pablo de Olavide',
    license: 'CC BY-SA 2.0',
  },
  'graduacion-3': {
    file: 'Graduación Traducción e Interpretación - Inglés (42299153194).jpg',
    alt: 'Entrega de títulos en un acto de graduación',
    author: 'Universidad Pablo de Olavide',
    license: 'CC BY-SA 2.0',
  },
  seminario: {
    file: 'Seminario entre Argentina y Singapur.jpg',
    alt: 'Sesión de trabajo en un seminario',
    author: 'Cancillería Argentina',
    license: 'CC BY 2.0',
  },
  auditorio: {
    file: 'UDS Multipurpose Auditorium.jpg',
    alt: 'Auditorio de usos múltiples',
    author: 'Abdul-Rauf Moshie',
    license: 'CC BY 4.0',
  },
  'biblioteca-1': {
    file: "Douglas Library 1923 Reading Room, Queen's University at Kingston.jpg",
    alt: 'Sala de lectura de una biblioteca universitaria',
    author: 'Takipoint123',
    license: 'CC BY-SA 4.0',
  },
  'biblioteca-2': {
    file: 'Graz University-Library reading-room.jpg',
    alt: 'Sala de lectura con estanterías de dos niveles',
    author: 'Dr. Marcus Gossler',
    license: 'CC BY-SA 3.0',
  },
  participantes: {
    file: 'OpenCon 2016 Monrovia Conference Participants.jpg',
    alt: 'Participantes de un encuentro académico',
    author: 'Musa Zukeh Sheriff',
    license: 'CC BY-SA 4.0',
  },
} satisfies Record<string, SeedPhoto>;

export type PhotoKey = keyof typeof PHOTOS;

/** Videos reales de los canales oficiales de YouTube de las universidades (verificados). */
export const VIDEOS: { url: string; title: string; uni: string }[] = [
  {
    url: 'https://www.youtube.com/watch?v=YFgaqkjYm2o',
    title: 'Somos la Universidad Rafael Landívar',
    uni: 'URL',
  },
  {
    url: 'https://www.youtube.com/watch?v=IDrA9TOImkg',
    title: 'Campus Central de la Landívar desde el aire',
    uni: 'URL',
  },
  {
    url: 'https://www.youtube.com/watch?v=cu53n76d3z4',
    title: 'Video institucional de la Universidad Galileo',
    uni: 'Galileo',
  },
  {
    url: 'https://www.youtube.com/watch?v=F-eK3QRwfxo',
    title: 'Recorrido virtual por el campus central de Galileo',
    uni: 'Galileo',
  },
  {
    url: 'https://www.youtube.com/watch?v=GXO6W78kzPo',
    title: 'Open Day: Maestría en Ingeniería Biomédica',
    uni: 'Galileo',
  },
  {
    url: 'https://www.youtube.com/watch?v=N9FS1SS-Vdw',
    title: 'Graduación de maestría y doctorado, diciembre 2024',
    uni: 'Galileo',
  },
  {
    url: 'https://www.youtube.com/watch?v=4l5SGkZPWtY',
    title: 'Conócenos: Universidad del Valle de Guatemala',
    uni: 'UVG',
  },
  {
    url: 'https://www.youtube.com/watch?v=zd9q2YjEc3g',
    title: '50 años de la Universidad Mariano Gálvez',
    uni: 'UMG',
  },
  {
    url: 'https://www.youtube.com/watch?v=ytY_sdF8Cxo',
    title: 'Presentación del Memorial de Sololá en la sede Quetzaltenango',
    uni: 'UMES',
  },
  {
    url: 'https://www.youtube.com/watch?v=UoVCdcdhD5U',
    title: 'Descubre la Universidad del Istmo',
    uni: 'UNIS',
  },
  {
    url: 'https://www.youtube.com/watch?v=SdlYZ3KxKdk',
    title: 'Veinte años de la UNIS',
    uni: 'UNIS',
  },
  {
    url: 'https://www.youtube.com/watch?v=yc-synskZIg',
    title: 'Video institucional de la Universidad Panamericana',
    uni: 'UPANA',
  },
  {
    url: 'https://www.youtube.com/watch?v=KCMAVCh2xBs',
    title: 'Conoce la Universidad Galileo',
    uni: 'Galileo',
  },
];
