const request = require('supertest');
const { criarApp } = require('../src/app');

/** Notificações geradas pelos eventos (Observer), lidas pela API. */
const AGORA = new Date('2026-11-10T12:00:00-03:00');

describe('Notificações — API', () => {
  let app;
  let org;
  let ana;
  let bia;

  const cadastrar = async (nome, email) => {
    const res = await request(app).post('/api/auth/cadastro').send({ nome, email, senha: 'senha1234' });
    return { id: res.body.usuario.id, auth: { Authorization: `Bearer ${res.body.token}` } };
  };
  const notificacoes = async (quem, query = '') => (await request(app).get(`/api/notificacoes${query}`).set(quem.auth)).body;

  beforeEach(async () => {
    app = criarApp({ jwtSegredo: 'segredo-de-teste', custoBcrypt: 4, relogio: () => AGORA });
    org = await cadastrar('Mariana', 'mariana@exemplo.com');
    ana = await cadastrar('Ana', 'ana@exemplo.com');
    bia = await cadastrar('Bia', 'bia@exemplo.com');
  });

  const criar = async (extra = {}) => (await request(app).post('/api/atividades').set(org.auth).send({
    titulo: 'Corrida leve',
    tipo: 'corrida',
    nivel: 'iniciante',
    publicoAlvo: 'todos',
    dataHora: '2026-11-15T07:00:00-03:00',
    local: 'Parque Villa-Lobos',
    numeroIntegrantes: 5,
    ...extra,
  })).body;

  test('CT-05: solicitar avisa o organizador; responder avisa o participante', async () => {
    const a = await criar();
    const pedido = (await request(app).post(`/api/atividades/${a.id}/participacoes`).set(ana.auth)).body;

    const doOrg = await notificacoes(org);
    expect(doOrg.naoLidas).toBe(1);
    expect(doOrg.itens[0]).toMatchObject({
      tipo: 'SOLICITACAO_RECEBIDA', atividadeId: a.id, lida: false,
      mensagem: 'Ana pediu para participar de "Corrida leve"',
    });

    await request(app).patch(`/api/participacoes/${pedido.id}`).set(org.auth).send({ decisao: 'RECUSAR' });
    const daAna = await notificacoes(ana);
    expect(daAna.itens.map((n) => n.tipo)).toEqual(['SOLICITACAO_RECUSADA']);
  });

  test('convite e resposta geram avisos para os dois lados', async () => {
    const a = await criar({ visibilidade: 'PRIVADA' });
    const convite = (await request(app).post(`/api/atividades/${a.id}/convites`).set(org.auth).send({ email: 'bia@exemplo.com' })).body;
    expect((await notificacoes(bia)).itens[0].mensagem).toBe('Mariana convidou você para "Corrida leve"');

    await request(app).patch(`/api/convites/${convite.id}`).set(bia.auth).send({ decisao: 'ACEITAR' });
    expect((await notificacoes(org)).itens[0]).toMatchObject({ tipo: 'CONVITE_ACEITO', mensagem: 'Bia aceitou o convite para "Corrida leve"' });
  });

  test('cancelar a atividade e mudar o local avisam os inscritos', async () => {
    const a = await criar();
    const pedido = (await request(app).post(`/api/atividades/${a.id}/participacoes`).set(ana.auth)).body;
    await request(app).patch(`/api/participacoes/${pedido.id}`).set(org.auth).send({ decisao: 'ACEITAR' });
    await request(app).post(`/api/atividades/${a.id}/participacoes`).set(bia.auth);

    await request(app).patch(`/api/atividades/${a.id}`).set(org.auth).send({ local: 'Parque do Povo' });
    // mudar só a descrição não gera aviso
    await request(app).patch(`/api/atividades/${a.id}`).set(org.auth).send({ descricao: 'Tragam água' });
    await request(app).post(`/api/atividades/${a.id}/cancelar`).set(org.auth);

    expect((await notificacoes(ana)).itens.map((n) => n.tipo))
      .toEqual(['ATIVIDADE_CANCELADA', 'ATIVIDADE_ALTERADA', 'SOLICITACAO_ACEITA']);
    expect((await notificacoes(bia)).itens.map((n) => n.tipo)).toEqual(['ATIVIDADE_CANCELADA', 'ATIVIDADE_ALTERADA']);
  });

  test('marcar uma e todas como lidas; não mexe na notificação de outra pessoa', async () => {
    const a = await criar();
    await request(app).post(`/api/atividades/${a.id}/participacoes`).set(ana.auth);
    await request(app).post(`/api/atividades/${a.id}/participacoes`).set(bia.auth);
    const { itens } = await notificacoes(org);
    expect(itens).toHaveLength(2);

    expect((await request(app).patch(`/api/notificacoes/${itens[0].id}/lida`).set(ana.auth)).status).toBe(404);
    const lida = await request(app).patch(`/api/notificacoes/${itens[0].id}/lida`).set(org.auth);
    expect(lida.body.lida).toBe(true);

    const naoLidas = await notificacoes(org, '?naoLidas=true');
    expect(naoLidas).toMatchObject({ naoLidas: 1, itens: [{ id: itens[1].id }] });

    expect((await request(app).post('/api/notificacoes/lidas').set(org.auth)).body).toEqual({ naoLidas: 0 });
    expect((await notificacoes(org)).naoLidas).toBe(0);
  });

  test('exige login', async () => {
    expect((await request(app).get('/api/notificacoes')).status).toBe(401);
  });
});
