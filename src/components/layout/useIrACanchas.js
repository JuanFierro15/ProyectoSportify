import { useVistaCanchas } from '../../context/VistaCanchasContext';
import { DEPORTES } from '../../data/deportes';
import { esClicNormal } from '../../lib/rutas';

/**
 * Hook con la lógica de navegación a canchas compartida entre Navbar y Footer.
 * Si la vista de canchas ya está abierta, hace scroll al tope (respetando
 * prefers-reduced-motion). Si no, abre la vista en el primer deporte.
 */
export function useIrACanchas() {
  const { deporteAbierto, abrirVista } = useVistaCanchas();

  return (e) => {
    if (!esClicNormal(e)) return;
    e.preventDefault();
    if (deporteAbierto) {
      const prefiereReducido =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({
        top: 0,
        behavior: prefiereReducido ? 'auto' : 'smooth',
      });
    } else {
      abrirVista(DEPORTES[0].slug);
    }
  };
}

export default useIrACanchas;
