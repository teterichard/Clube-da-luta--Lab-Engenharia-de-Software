const request = require('supertest');
const { criarApp } = require('../src/app');

/** RF07 — convidar pessoas específicas (UC 5.2, passo 4) ponta a ponta, com usuários reais cadastrados. */
const AGORA = new Date('2026-11-10T12:00:00-03:00');

const corpo = (extra = {}) => ({
  titulo: 'Crochê na casa da Ângela',
  tipo: 'outro',
  nivel: 'iniciante',
  publicoAlvo: 'todos',
  dataHora: '2026-11-22T15:00:00-03:00',
  local: 'Rua das Flores, 10',
  numeroIntegrantes: 2,
  visibilidade: 'PRIVADA',
  ...extra,
});

describe('Convites — API', () => {
  let app;
  let org;
  let ana;
  let bia;

  const cadastrar = async (nome, email) => {
    const res = await request(app).post('/api/auth/cadastro').send({ nome, email, senha: 'senha1234' });
    return { id: res.body.usuario.id, auth: { Authorization: `Bearer ${res.body.token}` } };
  };

  beforeEach(async () => {
    app = criarApp({ jwtSegredo: 'segredo-de-teste', custoBcrypt: 4, relogio: () => AGORA });
    org = await cadastrar('Ângela', 'angela@exemplo.com');
    ana = await cadastrar('Ana', 'ana@exemplo.com');
    bia = await cadastrar('Bia', 'bia@exemplo.com');
  });

  const criar = async (extra) => (await request(app).post('/api/atividades').set(org.auth).send(corpo(extra))).body;
  const convidar = (atividadeId, email, quem = org) => request(app)
    .post(`/api/atividades/${atividadeId}/convites`).set(quem.auth).send({ email });
  const responder = (conviteId, quem, decisao) => request(app)
    .patch(`/api/convites/${conviteId}`).set(quem.auth).send({ decisao });

  test('fluxo completo: privada → convite → convidado vê, aceita e ocupa vaga', async () => {
    const a = await criar();

    // antes do convite, a atividade privada não existe para a Ana
    expect((await request(app).get(`/api/atividades/${a.id}`).set(ana.auth)).status).toBe(404);
    expect((await request(app).post(`/api/atividades/${a.id}/participacoes`).set(ana.auth)).status).toBe(403);

    const convite = await convidar(a.id, 'ANA@exemplo.com');
    expect(convite.status).toBe(201);
    expect(convite.headers.location).toBe(`/api/convites/${convite.body.id}`);
    expect(convite.body).toMatchObject({ status: 'PENDENTE', convidado: { id: ana.id, nome: 'Ana' } });

    const recebidos = await request(app).get('/api/convites?status=pendente').set(ana.auth);
    expect(recebidos.body).toHaveLength(1);
    expect(recebidos.body[0].atividade).toMatchObject({ id: a.id, titulo: a.titulo });

    expect((await request(app).get(`/api/atividades/${a.id}`).set(ana.auth)).status).toBe(200);

    const aceito = await responder(convite.body.id, ana, 'ACEITAR');
    expect(aceito.status).toBe(200);
    expect(aceito.body.status).toBe('ACEITO');

    const detalhe = await request(app).get(`/api/atividades/${a.id}`).set(org.auth);
    expect(detalhe.body.vagas).toBe(1);
    const participacoes = await request(app).get(`/api/atividades/${a.id}/participacoes`).set(org.auth);
    expect(participacoes.body).toEqual([expect.objectContaining({ usuarioId: ana.id, status: 'ACEITO' })]);
  });

  test('recusar não ocupa vaga e permite novo convite', async () => {
    const a = await criar();
    const c = await convidar(a.id, 'ana@exemplo.com');
    expect((await responder(c.body.id, ana, 'RECUSAR')).body.status).toBe('RECUSADO');
    expect((await request(app).get(`/api/atividades/${a.id}`).set(org.auth)).body.vagas).toBe(2);
    expect((await request(app).get(`/api/atividades/${a.id}`).set(ana.auth)).status).toBe(404);
    expect((await convidar(a.id, 'ana@exemplo.com')).status).toBe(201);
  });

  test('erros: e-mail ausente 400, desconhecido 404, duplicado 409, não organizador 403', async () => {
    const a = await criar();
    expect((await convidar(a.id, '')).status).toBe(400);
    expect((await convidar(a.id, 'ninguem@exemplo.com')).status).toBe(404);
    expect((await convidar(a.id, 'ana@exemplo.com')).status).toBe(201);
    expect((await convidar(a.id, 'ana@exemplo.com')).status).toBe(409);
    expect((await convidar(a.id, 'bia@exemplo.com', ana)).status).toBe(403);
    expect((await convidar(a.id, 'angela@exemplo.com')).status).toBe(409);
  });

  test('só o convidado responde e só uma vez; sem vaga não aceita', async () => {
    const a = await criar({ numeroIntegrantes: 2 });
    const cAna = await convidar(a.id, 'ana@exemplo.com');
    const cBia = await convidar(a.id, 'bia@exemplo.com');
    expect((await responder(cAna.body.id, bia, 'ACEITAR')).status).toBe(403);
    expect((await responder(cAna.body.id, ana, 'ACEITAR')).status).toBe(200);
    expect((await responder(cAna.body.id, ana, 'RECUSAR')).status).toBe(409);

    // Carla ocupa a última vaga; o convite da Bia continua pendente, mas não pode mais ser aceito
    const outro = await cadastrar('Carla', 'carla@exemplo.com');
    const cCarla = await convidar(a.id, 'carla@exemplo.com');
    expect((await responder(cCarla.body.id, outro, 'ACEITAR')).status).toBe(200);
    expect((await responder(cBia.body.id, bia, 'ACEITAR')).status).toBe(409);
  });

  test('convite aceito em atividade pública confirma quem já tinha solicitado', async () => {
    const a = await criar({ visibilidade: 'PUBLICA', numeroIntegrantes: 5 });
    const pedido = await request(app).post(`/api/atividades/${a.id}/participacoes`).set(ana.auth);
    expect(pedido.body.status).toBe('PENDENTE');
    const c = await convidar(a.id, 'ana@exemplo.com');
    await responder(c.body.id, ana, 'ACEITAR');
    const lista = await request(app).get(`/api/atividades/${a.id}/participacoes`).set(org.auth);
    expect(lista.body).toHaveLength(1);
    expect(lista.body[0]).toMatchObject({ id: pedido.body.id, status: 'ACEITO' });
  });

  test('organizador lista os convites; outros não', async () => {
    const a = await criar();
    await convidar(a.id, 'ana@exemplo.com');
    const lista = await request(app).get(`/api/atividades/${a.id}/convites`).set(org.auth);
    expect(lista.body.map((c) => c.convidado.nome)).toEqual(['Ana']);
    expect((await request(app).get(`/api/atividades/${a.id}/convites`).set(ana.auth)).status).toBe(403);
  });

  test('excluir a atividade apaga os convites', async () => {
    const a = await criar();
    await convidar(a.id, 'ana@exemplo.com');
    expect((await request(app).delete(`/api/atividades/${a.id}`).set(org.auth)).status).toBe(204);
    expect((await request(app).get('/api/convites').set(ana.auth)).body).toEqual([]);
  });
});
