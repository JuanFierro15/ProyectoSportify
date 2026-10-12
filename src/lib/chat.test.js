import {
  MAX_TURNOS,
  MAX_MENSAJE,
  CLAVE_SESION,
  TEXTO_ERROR_CHAT,
  SUGERENCIAS_INICIALES,
  mensajeBienvenida,
  crearId,
  horaLocal,
  contextoChat,
  historialParaEnviar,
  normalizarRespuesta,
  parsearConversacion,
} from './chat';

describe('constantes y valores iniciales', () => {
  test('exporta las constantes de configuración esperadas', () => {
    expect(MAX_TURNOS).toBe(20);
    expect(MAX_MENSAJE).toBe(500);
    expect(CLAVE_SESION).toBe('sportify_chat_v1');
    expect(TEXTO_ERROR_CHAT).toBe('No pude responder ahora. Intenta de nuevo en un momento.');
    expect(SUGERENCIAS_INICIALES).toHaveLength(3);
  });

  test('mensajeBienvenida trae bienvenida true y 3 sugerencias', () => {
    const bienvenida = mensajeBienvenida();
    expect(bienvenida.id).toBe('bienvenida');
    expect(bienvenida.rol).toBe('bot');
    expect(bienvenida.bienvenida).toBe(true);
    expect(bienvenida.accion).toBeNull();
    expect(bienvenida.sugerencias).toHaveLength(3);
    expect(bienvenida.sugerencias).toEqual(SUGERENCIAS_INICIALES);
  });

  test('crearId genera identificadores no vacíos y únicos', () => {
    const id1 = crearId();
    const id2 = crearId();
    expect(typeof id1).toBe('string');
    expect(id1.length).toBeGreaterThan(0);
    expect(id1).not.toBe(id2);
  });
});

describe('horaLocal', () => {
  test('formatea horas y minutos con ceros a la izquierda', () => {
    expect(horaLocal(new Date(2026, 9, 12, 7, 5))).toBe('07:05');
  });

  test('formatea correctamente horas de la tarde', () => {
    expect(horaLocal(new Date(2026, 9, 12, 18, 30))).toBe('18:30');
  });
});

describe('contextoChat', () => {
  test('arma el contexto con fechaHoy, horaActual, canchas depuradas y disponibilidad', () => {
    const dias = ['2026-10-12', '2026-10-13'];
    const canchas = [
      {
        id: 'voley-1',
        nombre: 'Cancha Voley Playa 1',
        deporte: 'voley-playa',
        precioHora: 45000,
        horas: ['08:00', '09:00'],
        descripcion: 'x',
      },
      {
        id: 'padel-1',
        nombre: 'Pista Pádel 1',
        deporte: 'padel',
        precioHora: 55000,
        horas: ['08:00', '09:00'],
        descripcion: 'pista cubierta',
      },
    ];

    const mockDisponibilidad = (canchaId, fecha) => [
      { hora: '08:00', disponible: false },
      { hora: '09:00', disponible: true },
    ];

    const ahora = new Date(2026, 9, 12, 10, 15);
    const resultado = contextoChat({
      dias,
      canchas,
      disponibilidad: mockDisponibilidad,
      ahora,
    });

    expect(resultado.fechaHoy).toBe('2026-10-12');
    expect(resultado.horaActual).toBe('10:15');

    expect(resultado.canchas).toEqual([
      {
        id: 'voley-1',
        nombre: 'Cancha Voley Playa 1',
        deporte: 'voley-playa',
        precioHora: 45000,
      },
      {
        id: 'padel-1',
        nombre: 'Pista Pádel 1',
        deporte: 'padel',
        precioHora: 55000,
      },
    ]);

    expect(resultado.disponibilidad).toHaveLength(4);
    expect(resultado.disponibilidad).toEqual([
      { canchaId: 'voley-1', fecha: '2026-10-12', franjasLibres: ['09:00'] },
      { canchaId: 'voley-1', fecha: '2026-10-13', franjasLibres: ['09:00'] },
      { canchaId: 'padel-1', fecha: '2026-10-12', franjasLibres: ['09:00'] },
      { canchaId: 'padel-1', fecha: '2026-10-13', franjasLibres: ['09:00'] },
    ]);
  });
});

describe('historialParaEnviar', () => {
  test('excluye bienvenida y errores, conserva orden, recorta a 20 y limita a 1500 caracteres', () => {
    const textoLargo = 'a'.repeat(1600);
    const mensajes = [
      { id: '1', rol: 'bot', texto: 'Hola', bienvenida: true },
      { id: '2', rol: 'bot', texto: 'Fallo', error: true },
    ];

    for (let i = 1; i <= 25; i++) {
      mensajes.push({
        id: `m-${i}`,
        rol: i % 2 === 0 ? 'bot' : 'usuario',
        texto: i === 25 ? textoLargo : `Mensaje ${i}`,
      });
    }

    const resultado = historialParaEnviar(mensajes);

    expect(resultado).toHaveLength(20);
    expect(resultado[0].texto).toBe('Mensaje 6');
    expect(resultado[19].texto).toBe('a'.repeat(1500));
    expect(resultado[19].texto).toHaveLength(1500);
    expect(resultado.some((m) => m.texto === 'Hola')).toBe(false);
    expect(resultado.some((m) => m.texto === 'Fallo')).toBe(false);
  });
});

describe('normalizarRespuesta', () => {
  test('devuelve null con {}, con { respuesta: "" } y con texto plano', () => {
    expect(normalizarRespuesta({})).toBeNull();
    expect(normalizarRespuesta({ respuesta: '' })).toBeNull();
    expect(normalizarRespuesta({ respuesta: '   ' })).toBeNull();
    expect(normalizarRespuesta('texto')).toBeNull();
    expect(normalizarRespuesta(null)).toBeNull();
  });

  test('recorta a 3 sugerencias cuando llegan 5', () => {
    const json = {
      respuesta: 'Información general',
      sugerencias: ['Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco'],
    };
    const resultado = normalizarRespuesta(json);
    expect(resultado.respuesta).toBe('Información general');
    expect(resultado.sugerencias).toEqual(['Uno', 'Dos', 'Tres']);
    expect(resultado.accion).toBeNull();
  });

  test('accion sin tipo se convierte en null y ABRIR_SECCION se conserva', () => {
    const sinTipo = {
      respuesta: 'Hola',
      accion: { detalle: 'sin tipo' },
    };
    expect(normalizarRespuesta(sinTipo).accion).toBeNull();

    const conTipo = {
      respuesta: 'Abriendo canchas',
      accion: { tipo: 'ABRIR_SECCION', seccion: 'canchas', deporte: 'padel' },
    };
    expect(normalizarRespuesta(conTipo).accion).toEqual({
      tipo: 'ABRIR_SECCION',
      seccion: 'canchas',
      deporte: 'padel',
    });
  });
});

describe('parsearConversacion', () => {
  test('devuelve null con no json, con [] y con un elemento sin id', () => {
    expect(parsearConversacion('no json')).toBeNull();
    expect(parsearConversacion('[]')).toBeNull();
    expect(
      parsearConversacion(
        JSON.stringify([{ rol: 'usuario', texto: 'Hola sin id' }])
      )
    ).toBeNull();
    expect(
      parsearConversacion(
        JSON.stringify([{ id: '', rol: 'usuario', texto: 'Id vacío' }])
      )
    ).toBeNull();
    expect(
      parsearConversacion(
        JSON.stringify([{ id: '1', rol: 'invalido', texto: 'Rol inválido' }])
      )
    ).toBeNull();
  });

  test('devuelve el arreglo con un caso válido', () => {
    const conversacion = [
      { id: '1', rol: 'usuario', texto: '¿Tienen cancha hoy?' },
      { id: '2', rol: 'bot', texto: 'Sí, tenemos disponibilidad.' },
    ];
    expect(parsearConversacion(JSON.stringify(conversacion))).toEqual(conversacion);
  });
});
