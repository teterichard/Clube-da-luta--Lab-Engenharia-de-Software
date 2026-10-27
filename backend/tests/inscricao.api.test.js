const request = require('supertest');
const jwt = require('jsonwebtoken');
const { criarApp } = require('../src/app');
const { criarAtividadeRepositoryMemoria } = require('../src/repositories/atividadeRepositoryMemoria');
const { criarParticipacaoRepositoryMemoria } = require('../src/repositories/participacaoRepositoryMemoria');

/**
 * Caso de uso principal "Inscrever-se em atividade" ponta a ponta (wiki — CT-01 a CT-07).
 */
const SEGREDO = 'segredo-de-teste';
const AGORA = new Date('2026-10-27T12:00:00-03:00');

const ORGANIZADOR = 1;
const JOAO = 2;
const MARIA = 3;
const PEDRO = 4;
const auth = (sub) => ({ Authorization: `Bearer ${jwt.sign({ sub, nome: `u${sub}` }, SEGREDO)}` });

const corpo = (extra = {}) => ({
  titulo: 'Futebol no parque',
  tipo: 'futebol',
  nivel: 'iniciante',
  publicoAlvo: 'adultos',
  dataHora: '2026-11-20T18:00:00-03:00',
  local: 'Parque Ibirapuera - campo 1',
  numeroIntegrantes: 2,
  ...extra,
});

describe('Inscrever-se em atividade — API', () => {
  let app;

  beforeEach(() => {
    app = criarApp({
      atividadeRepository: criarAtividadeRepositoryMemoria(),
      participacaoRepository: criarParticipacaoRepositoryMemoria(),
      jwtSegredo: SEGREDO,
      relogio: () => AGORA,
    });
  });

  const criar = async (extra) => (await request(app).post('/api/atividades').set(auth(ORGANIZADOR)).send(corpo(extra))).body;
  const solicitar = (atividadeId, sub) => request(app).post(`/api/atividades/${atividadeId}/participacoes`).set(auth(sub));
  const responder = (participacaoId, sub, decisao) => request(app)
    .patch(`/api/participacoes/${participacaoId}`).set(auth(sub)).send({ decisao });

  test('CT-01: fluxo básico — filtrar, ver vagas, solicitar e ser aceito', async () => {
    const futebol = await criar();
    await criar({ titulo: 'Vôlei de praia', tipo: 'volei' });

    const lista = await request(app).get('/api/atividades?tipo=futebol&nivel=iniciante').set(auth(JOAO));
    expect(lista.status).toBe(200);
    expect(lista.body.map((a) => a.id)).toEqual([futebol.id]);
    expect(lista.body[0].vagas).toBe(2);

    const pedido = await solicitar(futebol.id, JOAO);
    expect(pedido.status).toBe(201);
    expect(pedido.headers.location).toBe(`/api/participacoes/${pedido.body.id}`);
    expect(pedido.body).toMatchObject({ status: 'PENDENTE', usuarioId: JOAO });

    const resposta = await responder(pedido.body.id, ORGANIZADOR, 'ACEITAR');
    expect(resposta.status).toBe(200);
    expect(resposta.body.status).toBe('ACEITO');

    const detalhe = await request(app).get(`/api/atividades/${futebol.id}`).set(auth(JOAO));
    expect(detalhe.body.vagas).toBe(1);
  });

  test('CT-02: sem login não lista nem solicita', async () => {
    const futebol = await criar();
    expect((await request(app).get('/api/atividades')).status).toBe(401);
    expect((await request(app).post(`/api/atividades/${futebol.id}/participacoes`)).status).toBe(401);
  });

  test('CT-03: filtro sem resultado retorna lista vazia', async () => {
    await criar();
    const res = await request(app).get('/api/atividades?tipo=surf').set(auth(JOAO));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('CT-04: atividade lotada retorna 409 e não cria participação', async () => {
    const futebol = await criar({ numeroIntegrantes: 2 });
    for (const sub of [JOAO, MARIA]) {
      const p = await solicitar(futebol.id, sub);
      await responder(p.body.id, ORGANIZADOR, 'ACEITAR');
    }

    const res = await solicitar(futebol.id, PEDRO);
    expect(res.status).toBe(409);
    expect(res.body.erro).toBe('Atividade sem vagas');

    const pedidos = await request(app).get(`/api/atividades/${futebol.id}/participacoes`).set(auth(ORGANIZADOR));
    expect(pedidos.body).toHaveLength(2);
    // filtro comVaga esconde a atividade lotada
    const comVaga = await request(app).get('/api/atividades?comVaga=true').set(auth(PEDRO));
    expect(comVaga.body).toEqual([]);
  });

  test('CT-05: organizador recusa — status REJEITADO e vaga não é descontada', async () => {
    const futebol = await criar();
    const p = await solicitar(futebol.id, JOAO);

    const res = await responder(p.body.id, ORGANIZADOR, 'RECUSAR');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('REJEITADO');

    const detalhe = await request(app).get(`/api/atividades/${futebol.id}`).set(auth(JOAO));
    expect(detalhe.body.vagas).toBe(2);
  });

  test('CT-06: segunda solicitação do mesmo usuário retorna 409', async () => {
    const futebol = await criar();
    await solicitar(futebol.id, JOAO);
    const res = await solicitar(futebol.id, JOAO);
    expect(res.status).toBe(409);
    expect(res.body.erro).toBe('Solicitação já enviada');
  });

  test('CT-07: filtros combinados (tipo + nível + público-alvo + local)', async () => {
    const alvo = await criar({ titulo: 'Basquete adulto', tipo: 'basquete', nivel: 'intermediario', local: 'Quadra Mackenzie' });
    await criar({ titulo: 'Basquete teen', tipo: 'basquete', nivel: 'intermediario', publicoAlvo: 'adolescentes' });
    await criar({ titulo: 'Basquete iniciante', tipo: 'basquete', nivel: 'iniciante' });

    const res = await request(app)
      .get('/api/atividades')
      .query({ tipo: 'basquete', nivel: 'intermediario', publicoAlvo: 'adultos', local: 'mackenzie' })
      .set(auth(JOAO));
    expect(res.body.map((a) => a.id)).toEqual([alvo.id]);
  });

  test('somente o organizador vê e responde as solicitações (403)', async () => {
    const futebol = await criar();
    const p = await solicitar(futebol.id, JOAO);

    expect((await request(app).get(`/api/atividades/${futebol.id}/participacoes`).set(auth(MARIA))).status).toBe(403);
    expect((await responder(p.body.id, JOAO, 'ACEITAR')).status).toBe(403);
  });

  test('atividade privada não aparece na lista nem aceita solicitação direta', async () => {
    const privada = await criar({ visibilidade: 'PRIVADA' });

    expect((await request(app).get('/api/atividades').set(auth(JOAO))).body).toEqual([]);
    expect((await request(app).get(`/api/atividades/${privada.id}`).set(auth(JOAO))).status).toBe(404);
    expect((await request(app).get(`/api/atividades/${privada.id}`).set(auth(ORGANIZADOR))).status).toBe(200);
    expect((await solicitar(privada.id, JOAO)).status).toBe(403);
  });

  test('ids inexistentes e dados inválidos', async () => {
    expect((await solicitar(999, JOAO)).status).toBe(404);
    expect((await responder(999, ORGANIZADOR, 'ACEITAR')).status).toBe(404);
    expect((await request(app).get('/api/atividades?nivel=profissional').set(auth(JOAO))).status).toBe(400);

    const futebol = await criar();
    const p = await solicitar(futebol.id, JOAO);
    const res = await responder(p.body.id, ORGANIZADOR, 'talvez');
    expect(res.status).toBe(400);
    expect(res.body.detalhes[0].campo).toBe('decisao');
  });
});
