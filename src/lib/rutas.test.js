import { esClicNormal, leerRuta, rutaReserva } from './rutas';

const OPCIONES = {
  slugs: ['voley-playa', 'padel', 'futbol'],
  modos: ['cancha', 'torneo', 'cumpleanos'],
};

describe('rutaReserva', () => {
  test('devuelve /reservar/<slug> cuando no se pasa modo o es cancha', () => {
    expect(rutaReserva('padel')).toBe('/reservar/padel');
    expect(rutaReserva('voley-playa', 'cancha')).toBe('/reservar/voley-playa');
  });

  test('agrega ?modo=<modo> cuando el modo es distinto de cancha', () => {
    expect(rutaReserva('padel', 'torneo')).toBe('/reservar/padel?modo=torneo');
    expect(rutaReserva('futbol', 'cumpleanos')).toBe('/reservar/futbol?modo=cumpleanos');
  });
});

describe('leerRuta', () => {
  test('reconoce /reservar/<slug> válido con o sin barra final', () => {
    expect(
      leerRuta({ pathname: '/reservar/padel', search: '', hash: '' }, OPCIONES)
    ).toEqual({
      deporte: 'padel',
      modo: 'cancha',
      redirigir: null,
    });

    expect(
      leerRuta({ pathname: '/reservar/voley-playa/', search: '', hash: '' }, OPCIONES)
    ).toEqual({
      deporte: 'voley-playa',
      modo: 'cancha',
      redirigir: null,
    });
  });

  test('toma ?modo= válido y cae en cancha cuando no es válido', () => {
    expect(
      leerRuta({ pathname: '/reservar/futbol', search: '?modo=torneo', hash: '' }, OPCIONES)
    ).toEqual({
      deporte: 'futbol',
      modo: 'torneo',
      redirigir: null,
    });

    expect(
      leerRuta({ pathname: '/reservar/futbol', search: '?modo=otro', hash: '' }, OPCIONES)
    ).toEqual({
      deporte: 'futbol',
      modo: 'cancha',
      redirigir: null,
    });
  });

  test('redirige a / cuando falta el deporte o el slug no existe', () => {
    expect(
      leerRuta({ pathname: '/reservar', search: '', hash: '' }, OPCIONES)
    ).toEqual({
      deporte: null,
      modo: 'cancha',
      redirigir: '/',
    });

    expect(
      leerRuta({ pathname: '/reservar/', search: '', hash: '' }, OPCIONES)
    ).toEqual({
      deporte: null,
      modo: 'cancha',
      redirigir: '/',
    });

    expect(
      leerRuta({ pathname: '/reservar/tenis', search: '?modo=torneo', hash: '' }, OPCIONES)
    ).toEqual({
      deporte: null,
      modo: 'cancha',
      redirigir: '/',
    });
  });

  test('convierte el hash viejo #canchas-<slug> en redirección a /reservar/<slug>', () => {
    expect(
      leerRuta({ pathname: '/', search: '', hash: '#canchas-padel' }, OPCIONES)
    ).toEqual({
      deporte: 'padel',
      modo: 'cancha',
      redirigir: '/reservar/padel',
    });

    expect(
      leerRuta({ pathname: '/', search: '', hash: '#canchas-invalido' }, OPCIONES)
    ).toEqual({
      deporte: null,
      modo: 'cancha',
      redirigir: null,
    });
  });

  test('cualquier otra ruta queda en la página de inicio sin redirección', () => {
    expect(
      leerRuta({ pathname: '/', search: '', hash: '' }, OPCIONES)
    ).toEqual({
      deporte: null,
      modo: 'cancha',
      redirigir: null,
    });

    expect(
      leerRuta({ pathname: '/', search: '', hash: '#eventos' }, OPCIONES)
    ).toEqual({
      deporte: null,
      modo: 'cancha',
      redirigir: null,
    });
  });
});

describe('esClicNormal', () => {
  const base = {
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    defaultPrevented: false,
  };

  test('devuelve true solo en clic izquierdo sin teclas modificadoras ni preventDefault', () => {
    expect(esClicNormal(base)).toBe(true);
    expect(esClicNormal({ ...base, button: 1 })).toBe(false);
    expect(esClicNormal({ ...base, ctrlKey: true })).toBe(false);
    expect(esClicNormal({ ...base, metaKey: true })).toBe(false);
    expect(esClicNormal({ ...base, shiftKey: true })).toBe(false);
    expect(esClicNormal({ ...base, altKey: true })).toBe(false);
    expect(esClicNormal({ ...base, defaultPrevented: true })).toBe(false);
    expect(esClicNormal(null)).toBe(false);
  });
});
