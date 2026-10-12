import { finDeFranja } from './precios';

// Datos del negocio (src/data/negocio.json): formato del teléfono y horario a
// partir de las franjas. Única fuente para el footer, la sección de ubicación
// y el chatbot.

export function formatoTelefono(telefono) {
  const str = String(telefono ?? '');
  if (!/^\d{10}$/.test(str)) {
    return telefono;
  }
  return `${str.slice(0, 3)} ${str.slice(3, 6)} ${str.slice(6, 10)}`;
}

export function enlaceTelefono(telefono) {
  if (!telefono) return '';
  const soloDigitos = String(telefono).replace(/\D/g, '');
  return `tel:+57${soloDigitos}`;
}

export function textoHorario(horas) {
  if (!Array.isArray(horas) || horas.length === 0) {
    return '';
  }
  const apertura = horas[0].replace(/^0/, '');
  const cierre = finDeFranja(horas[horas.length - 1]).replace(/^0/, '');
  return `${apertura} - ${cierre}`;
}
