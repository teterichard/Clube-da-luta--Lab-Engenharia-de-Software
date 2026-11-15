const { criarPublicador } = require('../src/domain/eventos');

describe('Publicador de eventos (Observer)', () => {
  test('entrega o evento a todos os assinantes do tipo', async () => {
    const eventos = criarPublicador();
    const recebidos = [];
    eventos.assinar('a', (d) => recebidos.push(['1', d]));
    eventos.assinar('a', async (d) => recebidos.push(['2', d]));
    eventos.assinar('b', () => recebidos.push(['outro']));

    await eventos.publicar('a', 42);
    expect(recebidos).toEqual([['1', 42], ['2', 42]]);
  });

  test('erro num observador não impede os outros nem chega a quem publicou', async () => {
    const falhas = [];
    const eventos = criarPublicador({ aoFalhar: (e, tipo) => falhas.push([e.message, tipo]) });
    const recebidos = [];
    eventos.assinar('a', () => { throw new Error('quebrou'); });
    eventos.assinar('a', () => recebidos.push('ok'));

    await expect(eventos.publicar('a', {})).resolves.toBeUndefined();
    expect(recebidos).toEqual(['ok']);
    expect(falhas).toEqual([['quebrou', 'a']]);
  });

  test('cancelar a assinatura e publicar sem assinantes', async () => {
    const eventos = criarPublicador();
    const recebidos = [];
    const cancelar = eventos.assinar('a', () => recebidos.push(1));
    cancelar();
    await eventos.publicar('a');
    await eventos.publicar('ninguem-escuta');
    expect(recebidos).toEqual([]);
  });
});
