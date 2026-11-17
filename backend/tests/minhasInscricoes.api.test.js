const request = require('supertest');
const jwt = require('jsonwebtoken');
const { criarApp } = require('../src/app');

/** "Suas inscrições", "Minhas atividades" e cancelamento de inscrição (P6). */
const SEGREDO = 'segredo-de-teste';
const AGORA = new Date('2026-11-10T12:00:00-03:00');
const ORG = 1;
const JOAO = 2;
const MARIA = 3;
const auth = (sub) => ({ Authorization: `Bearer ${jwt.sign({ sub, nome: `u${sub}` }, SEGREDO)}` });

const corpo = (extra = {}) => ({
  titulo: 'Vôlei de praia',
  tipo: 'outro',
  nivel: 'intermediario',
  publicoAlvo: 'todos',
  dataHora: '2026-11-25T09:00:00-03:00',
  local: 'Praia do Gonzaga',
  numeroIntegrantes: 2,
  ...extra,
});

describe('Minhas inscrições e cancelamento — API', () => {
  let app;
  beforeEach(() => {
    app = criarApp({ jwtSegredo: SEGREDO, relogio: () => AGORA });
  });

  const criar = async (extra) => (await request(app).post('/api/atividades').set(auth(ORG)).send(corpo(extra))).body;
  const solicitar = async (id, sub) => (await request(app).post(`/api/atividades/${id}/participacoes`).set(auth(sub))).body;
  const aceitar = (pid) => request(app).patch(`/api/participacoes/${pid}`).set(auth(ORG)).send({ decisao: 'ACEITAR' });
  const cancelar = (pid, sub) => request(app).post(`/api/participacoes/${pid}/cancelar`).set(auth(sub));

  test('GET /participacoes/minhas traz as inscrições com resumo da atividade', async () => {
    const a = await criar();
    const b = await criar({ titulo: 'Futevôlei' });
    await solicitar(a.id, JOAO);
    const p = await solicitar(b.id, JOAO);
    await aceitar(p.id);
    await solicitar(a.id, MARIA);

    const res = await request(app).get('/api/participacoes/minhas').set(auth(JOAO));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((x) => [x.atividade.titulo, x.status]).sort())
      .toEqual([['Futevôlei', 'ACEITO'], ['Vôlei de praia', 'PENDENTE']]);
    expect((await request(app).get('/api/participacoes/minhas')).status).toBe(401);
  });

  test('GET /atividades/organizadas inclui privadas, vagas e pendentes', async () => {
    const a = await criar();
    await criar({ visibilidade: 'PRIVADA', titulo: 'Treino fechado' });
    await solicitar(a.id, JOAO);
    await solicitar(a.id, MARIA);

    const res = await request(app).get('/api/atividades/organizadas').set(auth(ORG));
    expect(res.status).toBe(200);
    expect(res.body.map((x) => [x.titulo, x.vagas, x.pendentes]))
      .toEqual([['Vôlei de praia', 2, 2], ['Treino fechado', 2, 0]]);
    expect((await request(app).get('/api/atividades/organizadas').set(auth(JOAO))).body).toEqual([]);
  });

  test('organizador vê o nome de quem pediu', async () => {
    const cadastrar = (nome, email) => request(app).post('/api/auth/cadastro').send({ nome, email, senha: 'senha1234' });
    const org = await cadastrar('Organizador', 'org@exemplo.com');
    const mari = await cadastrar('Mariana', 'mari@exemplo.com');
    const comToken = (r) => ({ Authorization: `Bearer ${r.body.token}` });

    const a = (await request(app).post('/api/atividades').set(comToken(org)).send(corpo())).body;
    await request(app).post(`/api/atividades/${a.id}/participacoes`).set(comToken(mari));
    const lista = await request(app).get(`/api/atividades/${a.id}/participacoes`).set(comToken(org));
    expect(lista.body[0].usuario).toEqual({ id: mari.body.usuario.id, nome: 'Mariana' });
  });

  test('cancelar uma inscrição aceita devolve a vaga e permite pedir de novo', async () => {
    const a = await criar();
    const p = await solicitar(a.id, JOAO);
    await aceitar(p.id);
    expect((await request(app).get(`/api/atividades/${a.id}`).set(auth(JOAO))).body.vagas).toBe(1);

    const res = await cancelar(p.id, JOAO);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CANCELADO');
    expect((await request(app).get(`/api/atividades/${a.id}`).set(auth(JOAO))).body.vagas).toBe(2);

    expect((await cancelar(p.id, JOAO)).status).toBe(409);
    expect((await request(app).post(`/api/atividades/${a.id}/participacoes`).set(auth(JOAO))).status).toBe(201);
  });

  test('outro usuário não cancela (403) e solicitação inexistente é 404', async () => {
    const a = await criar();
    const p = await solicitar(a.id, JOAO);
    expect((await cancelar(p.id, MARIA)).status).toBe(403);
    expect((await cancelar(p.id, ORG)).status).toBe(403);
    expect((await cancelar(999, JOAO)).status).toBe(404);
  });

  test('organizador não responde uma solicitação cancelada', async () => {
    const a = await criar();
    const p = await solicitar(a.id, JOAO);
    await cancelar(p.id, JOAO);
    expect((await aceitar(p.id)).status).toBe(409);
  });
});
