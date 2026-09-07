/**
 * Metadatos de cada deporte, compartidos por toda la app para mantener
 * continuidad visual: mismo nombre y mismo `colorAcento` en los DeporteHero,
 * en la sección de transición y en las cards del catálogo.
 */
export const DEPORTES = [
  { slug: 'voley-playa', nombre: 'Voley Playa', colorAcento: '#f6a94b' },
  { slug: 'padel', nombre: 'Pádel', colorAcento: '#3fa9f5' },
  { slug: 'futbol', nombre: 'Fútbol', colorAcento: '#5bd67d' },
];

export function deportePorSlug(slug) {
  return DEPORTES.find((d) => d.slug === slug) || null;
}
