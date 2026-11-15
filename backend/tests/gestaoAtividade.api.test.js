const request = require('supertest');
const jwt = require('jsonwebtoken');
const { criarApp } = require('../src/app');

/** RF04 (editar/excluir) e RF11 (ciclo de status) ponta a ponta. */
const SEGREDO = 'segredo-de-teste';
const AGORA = new Date('2026-11-10T12:00:00-03:00');
const ORGANIZADOR = 1;
const JOAO = 2;
const auth = (sub) => ({ Authorization: `Bearer ${jwt.sign({ sub, nome: `u${sub}` }, SEGREDO)}` });

const corpo = (extra = {}) => ({
  titulo: 'Corrida no Ibirapuera',
  tipo: 'corrida',
  nivel: 'iniciante',
  publicoAlvo: 'todos',
  dataHora: '2026-11-20T07:00:00-03:00',
  local: 'Portão 3',
  numeroIntegrantes: 3,
  ...extra,
});

describe('Gestão de atividade — API', () => {
  let app;
  beforeEach(() => {
    app = criarApp({ jwtSegredo: SEGREDO, relogio: () => AGORA });
  });

  const criar = async (extra) => (await request(app).post('/api/atividades').set(auth(ORGANIZADOR)).send(corpo(extra))).body;
  const aceitarJoao = async (id) => {
    const pedido = await request(app).post(`/api/atividades/${id}/participacoes`).set(auth(JOAO));
    await request(app).patch(`/api/participacoes/${pedido.body.id}`).set(auth(ORGANIZADOR)).send({ decisao: 'ACEITAR' });
  };

  test('organizador edita campos e recebe a atividade com vagas', async () => {
    const a = await criar();
    const res = await request(app).patch(`/api/atividades/${a.id}`).set(auth(ORGANIZADOR))
      .send({ local: 'Portão 10', numeroIntegrantes: 5 });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: a.id, local: 'Portão 10', numeroIntegrantes: 5, vagas: 5, titulo: a.titulo });

    const detalhe = await request(app).get(`/api/atividades/${a.id}`).set(auth(JOAO));
    expect(detalhe.body.local).toBe('Portão 10');
  });

  test('outro usuário não edita (403) e dados inválidos dão 400', async () => {
    const a = await criar();
    expect((await request(app).patch(`/api/atividades/${a.id}`).set(auth(JOAO)).send({ titulo: 'Hack' })).status).toBe(403);
    const invalido = await request(app).patch(`/api/atividades/${a.id}`).set(auth(ORGANIZADOR)).send({ nivel: 'pro' });
    expect(invalido.status).toBe(400);
    expect(invalido.body.detalhes[0].campo).toBe('nivel');
  });

  test('não reduz integrantes abaixo dos aceitos', async () => {
    const a = await criar({ numeroIntegrantes: 2 });
    await aceitarJoao(a.id);
    const res = await request(app).patch(`/api/atividades/${a.id}`).set(auth(ORGANIZADOR)).send({ numeroIntegrantes: 2 });
    expect(res.status).toBe(200);
    expect(res.body.vagas).toBe(1);
  });

  test('ciclo completo: iniciar → concluir, e não edita depois de iniciada', async () => {
    const a = await criar();
    const iniciada = await request(app).post(`/api/atividades/${a.id}/iniciar`).set(auth(ORGANIZADOR));
    expect(iniciada.status).toBe(200);
    expect(iniciada.body.status).toBe('ATIVA');

    expect((await request(app).patch(`/api/atividades/${a.id}`).set(auth(ORGANIZADOR)).send({ titulo: 'Outro' })).status).toBe(409);

    const concluida = await request(app).post(`/api/atividades/${a.id}/concluir`).set(auth(ORGANIZADOR));
    expect(concluida.body.status).toBe('CONCLUIDA');
    expect((await request(app).post(`/api/atividades/${a.id}/cancelar`).set(auth(ORGANIZADOR))).status).toBe(409);
  });

  test('atividade cancelada some da busca e não aceita inscrição', async () => {
    const a = await criar();
    const cancelada = await request(app).post(`/api/atividades/${a.id}/cancelar`).set(auth(ORGANIZADOR));
    expect(cancelada.body.status).toBe('CANCELADA');

    const lista = await request(app).get('/api/atividades').set(auth(JOAO));
    expect(lista.body).toEqual([]);
    expect((await request(app).post(`/api/atividades/${a.id}/participacoes`).set(auth(JOAO))).status).toBe(409);
  });

  test('só o organizador muda status', async () => {
    const a = await criar();
    expect((await request(app).post(`/api/atividades/${a.id}/iniciar`).set(auth(JOAO))).status).toBe(403);
  });

  test('excluir: 204 sem aceitos, 409 com aceitos, 404 depois de excluída', async () => {
    const vazia = await criar();
    const pedido = await request(app).post(`/api/atividades/${vazia.id}/participacoes`).set(auth(JOAO));
    expect(pedido.status).toBe(201);
    expect((await request(app).delete(`/api/atividades/${vazia.id}`).set(auth(JOAO))).status).toBe(403);
    expect((await request(app).delete(`/api/atividades/${vazia.id}`).set(auth(ORGANIZADOR))).status).toBe(204);
    expect((await request(app).get(`/api/atividades/${vazia.id}`).set(auth(ORGANIZADOR))).status).toBe(404);
    expect((await request(app).patch(`/api/participacoes/${pedido.body.id}`).set(auth(ORGANIZADOR)).send({ decisao: 'ACEITAR' })).status).toBe(404);

    const cheia = await criar();
    await aceitarJoao(cheia.id);
    expect((await request(app).delete(`/api/atividades/${cheia.id}`).set(auth(ORGANIZADOR))).status).toBe(409);
  });

  test('id inexistente devolve 404', async () => {
    expect((await request(app).patch('/api/atividades/999').set(auth(ORGANIZADOR)).send({})).status).toBe(404);
    expect((await request(app).post('/api/atividades/999/iniciar').set(auth(ORGANIZADOR))).status).toBe(404);
  });
});
