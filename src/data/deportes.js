/**
 * Metadatos de cada deporte, compartidos por toda la app para mantener
 * continuidad visual: mismo nombre y mismo `colorAcento` en los DeporteHero,
 * en la sección de transición y en las cards del catálogo.
 */
export const DEPORTES = [
  {
    slug: 'voley-playa',
    nombre: 'Voley Playa',
    colorAcento: '#f6a94b',
    eyebrow: 'Arena de nivel profesional',
    descripcion:
      'Sentí la arena fina bajo tus pies en canchas con drenaje de alto rendimiento, red reglamentaria e iluminación nocturna para disfrutar cada punto al aire libre.',
    superficie: 'Arena de cuarzo profesional',
  },
  {
    slug: 'padel',
    nombre: 'Pádel',
    colorAcento: '#3fa9f5',
    eyebrow: 'Pistas panorámicas de cristal',
    descripcion:
      'Jugá con máxima precisión en pistas con césped monofilamento, cerramientos de cristal templado y rebote uniforme en cada rincón.',
    superficie: 'Cristal templado y césped',
  },
  {
    slug: 'futbol',
    nombre: 'Fútbol',
    colorAcento: '#5bd67d',
    eyebrow: 'Césped sintético de alto impacto',
    descripcion:
      'Armá tu partido en canchas rápidas con amortiguación de última tecnología, arcos reglamentarios y visibilidad LED óptima para jugar con tu equipo.',
    superficie: 'Césped sintético con shock pad',
  },
];

export function deportePorSlug(slug) {
  return DEPORTES.find((d) => d.slug === slug) || null;
}
