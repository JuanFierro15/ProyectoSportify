import { estiloAcento } from './canchas';

describe('estiloAcento', () => {
  test('incluye token --accent-text con color-mix y #0f172a para contraste accesible', () => {
    const estilo = estiloAcento('#5bd67d');
    expect(estilo['--accent-text']).toContain('color-mix');
    expect(estilo['--accent-text']).toContain('#0f172a');
  });

  test('genera tokens válidos con el color por defecto', () => {
    const estilo = estiloAcento();
    expect(estilo['--accent']).toBe('#1779ba');
    expect(estilo['--accent-text']).toContain('#1779ba');
  });
});
