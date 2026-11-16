const request = require('supertest');
const { criarApp } = require('../src/app');

/** Comunidades de interesse ponta a ponta. */
describe('Comunidades — API', () => {
  let app;
  let angela;
  let francisco;
  let mariana;

  const cadastrar = async (nome, email) => {
    const res = await request(app).post('/api/auth/cadastro').send({ nome, email, senha: 'senha1234' });
    return { id: res.body.usuario.id, auth: { Authorization: `Bearer ${res.body.token}` } };
  };

  beforeEach(async () => {
    app = criarApp({ jwtSegredo: 'segredo-de-teste', custoBcrypt: 4 });
    angela = await cadastrar('Ângela', 'angela@exemplo.com');
    francisco = await cadastrar('Francisco', 'francisco@exemplo.com');
    mariana = await cadastrar('Mariana', 'mariana@exemplo.com');
  });

  const criar = async (dados, quem = angela) => request(app).post('/api/comunidades').set(quem.auth).send(dados);
  const croche = () => criar({ nome: 'Crochê SP', descricao: 'Encontros mensais de crochê' });
  const basquete = () => criar({ nome: 'Basquete Zona Sul', descricao: 'Pelada de sábado', visibilidade: 'PRIVADA' });

  test('criar: 201, quem cria vira admin e é contado como membro', async () => {
    const res = await croche();
    expect(res.status).toBe(201);
    expect(res.headers.location).toBe(`/api/comunidades/${res.body.id}`);
    expect(res.body).toMatchObject({ nome: 'Crochê SP', visibilidade: 'PUBLICA', totalMembros: 1, meuStatus: 'ATIVO', meuPapel: 'ADMIN' });
    expect((await criar({ nome: 'x' })).status).toBe(400);
    expect((await request(app).post('/api/comunidades').send({})).status).toBe(401);
  });

  test('listar e buscar mostram a situação de quem pergunta', async () => {
    await croche();
    await basquete();
    const todas = await request(app).get('/api/comunidades').set(francisco.auth);
    expect(todas.body.map((c) => [c.nome, c.meuStatus])).toEqual([['Basquete Zona Sul', null], ['Crochê SP', null]]);

    const busca = await request(app).get('/api/comunidades?busca=CROCH').set(francisco.auth);
    expect(busca.body.map((c) => c.nome)).toEqual(['Crochê SP']);
  });

  test('pública: entra direto, aparece em minhas e pode sair', async () => {
    const { body: c } = await croche();
    const entrou = await request(app).post(`/api/comunidades/${c.id}/membros`).set(francisco.auth);
    expect(entrou.status).toBe(201);
    expect(entrou.body).toMatchObject({ meuStatus: 'ATIVO', meuPapel: 'MEMBRO', totalMembros: 2 });
    expect((await request(app).post(`/api/comunidades/${c.id}/membros`).set(francisco.auth)).status).toBe(409);

    const minhas = await request(app).get('/api/comunidades/minhas').set(francisco.auth);
    expect(minhas.body.map((x) => x.id)).toEqual([c.id]);

    const membros = await request(app).get(`/api/comunidades/${c.id}/membros`).set(mariana.auth);
    expect(membros.body.map((m) => m.usuario.nome)).toEqual(['Ângela', 'Francisco']);

    const saiu = await request(app).delete(`/api/comunidades/${c.id}/membros/me`).set(francisco.auth);
    expect(saiu.body).toMatchObject({ meuStatus: null, totalMembros: 1 });
  });

  test('privada: pedido pendente, admin é notificado e aprova', async () => {
    const { body: c } = await basquete();
    const pedido = await request(app).post(`/api/comunidades/${c.id}/membros`).set(francisco.auth);
    expect(pedido.body).toMatchObject({ meuStatus: 'PENDENTE', totalMembros: 1 });

    // quem não é membro não vê a lista; o admin vê o pedido pendente
    expect((await request(app).get(`/api/comunidades/${c.id}/membros`).set(mariana.auth)).status).toBe(403);
    const membros = await request(app).get(`/api/comunidades/${c.id}/membros`).set(angela.auth);
    expect(membros.body.map((m) => [m.usuario.nome, m.status])).toEqual([['Ângela', 'ATIVO'], ['Francisco', 'PENDENTE']]);

    const aviso = (await request(app).get('/api/notificacoes').set(angela.auth)).body.itens[0];
    expect(aviso).toMatchObject({ tipo: 'PEDIDO_COMUNIDADE', comunidadeId: c.id, mensagem: 'Francisco pediu para entrar em "Basquete Zona Sul"' });

    expect((await request(app).patch(`/api/comunidades/${c.id}/membros/${francisco.id}`).set(mariana.auth).send({ decisao: 'ACEITAR' })).status).toBe(403);
    const aprovado = await request(app).patch(`/api/comunidades/${c.id}/membros/${francisco.id}`).set(angela.auth).send({ decisao: 'ACEITAR' });
    expect(aprovado.body).toMatchObject({ usuarioId: francisco.id, status: 'ATIVO' });

    expect((await request(app).get('/api/notificacoes').set(francisco.auth)).body.itens[0].tipo).toBe('PEDIDO_COMUNIDADE_ACEITO');
    expect((await request(app).get(`/api/comunidades/${c.id}/membros`).set(francisco.auth)).status).toBe(200);
  });

  test('privada: recusar remove o pedido e permite pedir de novo', async () => {
    const { body: c } = await basquete();
    await request(app).post(`/api/comunidades/${c.id}/membros`).set(mariana.auth);
    const recusado = await request(app).patch(`/api/comunidades/${c.id}/membros/${mariana.id}`).set(angela.auth).send({ decisao: 'RECUSAR' });
    expect(recusado.body.status).toBeNull();
    expect((await request(app).get(`/api/comunidades/${c.id}`).set(mariana.auth)).body.meuStatus).toBeNull();
    expect((await request(app).post(`/api/comunidades/${c.id}/membros`).set(mariana.auth)).status).toBe(201);
  });

  test('único admin não sai; depois de promover alguém, pode sair', async () => {
    const { body: c } = await croche();
    expect((await request(app).delete(`/api/comunidades/${c.id}/membros/me`).set(angela.auth)).status).toBe(409);
    await request(app).post(`/api/comunidades/${c.id}/membros`).set(francisco.auth);
    const promovido = await request(app).patch(`/api/comunidades/${c.id}/membros/${francisco.id}`).set(angela.auth).send({ papel: 'ADMIN' });
    expect(promovido.body.papel).toBe('ADMIN');
    expect((await request(app).delete(`/api/comunidades/${c.id}/membros/me`).set(angela.auth)).status).toBe(200);
    expect((await request(app).delete(`/api/comunidades/${c.id}/membros/me`).set(mariana.auth)).status).toBe(404);
  });

  test('admin edita; membro comum não', async () => {
    const { body: c } = await croche();
    await request(app).post(`/api/comunidades/${c.id}/membros`).set(francisco.auth);
    expect((await request(app).patch(`/api/comunidades/${c.id}`).set(francisco.auth).send({ nome: 'Tricô' })).status).toBe(403);
    const editada = await request(app).patch(`/api/comunidades/${c.id}`).set(angela.auth).send({ descricao: 'Agora quinzenal' });
    expect(editada.body).toMatchObject({ nome: 'Crochê SP', descricao: 'Agora quinzenal' });
  });

  test('comunidade inexistente é 404', async () => {
    expect((await request(app).get('/api/comunidades/999').set(angela.auth)).status).toBe(404);
    expect((await request(app).post('/api/comunidades/999/membros').set(angela.auth)).status).toBe(404);
  });
});
