import { useCallback } from 'react';
import { useVistaCanchas } from '../../context/VistaCanchasContext';
import { DEPORTES } from '../../data/deportes';

// Navegación de la acción ABRIR_SECCION del asistente, reutilizando la del
// sitio (abrirVista, cambiarDeporte, irASeccion). En eventos, abrirVista sube
// el contador `apertura` del contexto, así que si el usuario ya estaba en la
// página de reserva vuelve a arrancar en modo torneo.
export default function useAccionesChat() {
  const { deporteAbierto, abrirVista, cambiarDeporte, irASeccion } = useVistaCanchas();

  const irACanchas = useCallback(
    (slug) => {
      if (deporteAbierto) {
        cambiarDeporte(slug);
      } else {
        abrirVista(slug);
      }
    },
    [deporteAbierto, cambiarDeporte, abrirVista]
  );

  const irAEventos = useCallback(() => {
    abrirVista(DEPORTES[0].slug, { modo: 'torneo' });
  }, [abrirVista]);

  const irAUbicacion = useCallback(() => {
    irASeccion('ubicacion');
  }, [irASeccion]);

  return {
    irACanchas,
    irAEventos,
    irAUbicacion,
  };
}
