import { Box, Flex, Link, Typography } from '@strapi/design-system';

/**
 * Tarjeta de la página de inicio del panel: los pasos que más hace un editor de universidad y el
 * enlace a la guía completa (public/guia/, la sirve el propio Strapi en /guia/).
 */
const STEPS = [
  { title: 'Gestor de contenido', text: 'En el menú de la izquierda, el icono de la pluma.' },
  { title: 'Elige qué cargar', text: 'Programa académico, Representante, Actividad o Noticia.' },
  { title: 'Crea o edita', text: 'Botón «Crear nueva entrada»; cada campo explica qué va.' },
  { title: 'Guarda', text: 'Lo publicado aparece en el sitio en pocos minutos.' },
];

export function GuideWidget() {
  return (
    <Flex direction="column" alignItems="stretch" gap={3}>
      {STEPS.map((s, i) => (
        <Flex key={s.title} gap={3} alignItems="flex-start">
          <Box
            background="primary100"
            borderColor="primary200"
            hasRadius
            paddingLeft={2}
            paddingRight={2}
            paddingTop={1}
            paddingBottom={1}
          >
            <Typography variant="sigma" textColor="primary600">
              {i + 1}
            </Typography>
          </Box>
          <Flex direction="column" alignItems="flex-start">
            <Typography variant="omega" fontWeight="bold">
              {s.title}
            </Typography>
            <Typography variant="pi" textColor="neutral600">
              {s.text}
            </Typography>
          </Flex>
        </Flex>
      ))}
      <Box paddingTop={1}>
        <Link href="/guia/" isExternal>
          Abrir la guía completa, paso a paso
        </Link>
      </Box>
    </Flex>
  );
}
