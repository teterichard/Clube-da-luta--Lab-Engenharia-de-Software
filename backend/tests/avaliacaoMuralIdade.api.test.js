const request = require('supertest');
const { criarApp } = require('../src/app');

/**
 * Avaliações (RF12–RF14, RF18), mural da comunidade (RF17), faixa etária (RF19/RNF08),
 * campos e vagas da comunidade (RF15) e CORS do deploy — ponta a ponta pela API.
 * O relógio é controlado para "passar o tempo".
 */
describe('Avaliações, mural e faixa etária — API', () => {
  let app;
  let agora;

  beforeEach(() => {
    agora = new Date('2026-11-16T12:00:00Z');
    app = criarApp({
      jwtSegredo: 'segredo-de-teste', custoBcrypt: 4, relogio: () => agora, corsOrigem: 'https://topa-ai.vercel.app',
    });
  });

  const cadastrar = async (nome, idade) => {
    const res = await request(app).post('/api/auth/cadastro').send({
      nome, email: `${nome.toLowerCase()}@exemplo.com`, senha: 'senha1234', ...(idade != null ? { idade } : {}),
    });
    return { id: res.body.usuario.id, auth: { Authorization: `Bearer ${res.body.token}` } };
  };

  const novaAtividade = async (quem, extra = {}) => (await request(app).post('/api/atividades').set(quem.auth).send({
    titulo: 'Basquete no Ibirapuera',
    tipo: 'basquete',
    nivel: 'iniciante',
    publicoAlvo: 'todos',
    dataHora: '2026-11-20T18:00:00-03:00',
    local: 'Parque Ibirapuera',
    numeroIntegrantes: 3,
    ...extra,
  })).body;

  const entrarNaAtividade = async (org, quem, a) => {
    const p = await request(app).post(`/api/atividades/${a.id}/participacoes`).set(quem.auth);
    await request(app).patch(`/api/participacoes/${p.body.id}`).set(org.auth).send({ decisao: 'ACEITAR' });
  };

  const concluir = async (org, a) => {
    await request(app).post(`/api/atividades/${a.id}/iniciar`).set(org.auth);
    return request(app).post(`/api/atividades/${a.id}/concluir`).set(org.auth);
  };

  const notificacoes = async (quem) => (await request(app).get('/api/notificacoes').set(quem.auth)).body.itens;

  // ------------------------------------------------------------------ RF19
  describe('faixa etária', () => {
    test('menor não vê nem entra em atividade para adultos; adulto não entra em atividade para menores', async () => {
      const org = await cadastrar('Org', 35);
      const teen = await cadastrar('Teen', 15);
      const adulto = await cadastrar('Adulto', 30);
      const soAdultos = await novaAtividade(org, { publicoAlvo: 'adultos' });
      const sub17 = await novaAtividade(org, { publicoAlvo: 'menores', titulo: 'Futebol sub-17' });

      const lista = (await request(app).get('/api/atividades').set(teen.auth)).body.map((a) => a.id);
      expect(lista).toEqual([sub17.id]);

      const barrado = await request(app).post(`/api/atividades/${soAdultos.id}/participacoes`).set(teen.auth);
      expect(barrado.status).toBe(403);
      expect(barrado.body.erro).toBe('Esta atividade é só para maiores de 18 anos');
      expect((await request(app).post(`/api/atividades/${sub17.id}/participacoes`).set(adulto.auth)).status).toBe(403);
      expect((await request(app).post(`/api/atividades/${sub17.id}/participacoes`).set(teen.auth)).status).toBe(201);
    });

    test('sem idade no perfil: vê a atividade, mas precisa informar a idade para entrar', async () => {
      const org = await cadastrar('Org', 35);
      const semIdade = await cadastrar('Sem');
      const a = await novaAtividade(org, { publicoAlvo: 'adultos' });

      expect((await request(app).get('/api/atividades').set(semIdade.auth)).body).toHaveLength(1);
      const pedido = await request(app).post(`/api/atividades/${a.id}/participacoes`).set(semIdade.auth);
      expect(pedido.status).toBe(409);
      expect(pedido.body.erro).toContain('Informe sua idade no perfil');

      await request(app).patch('/api/usuarios/me').set(semIdade.auth).send({ idade: 22 });
      expect((await request(app).post(`/api/atividades/${a.id}/participacoes`).set(semIdade.auth)).status).toBe(201);
    });

    test('convite: organizador não convida quem está fora da faixa; convidado fora da faixa não aceita', async () => {
      const org = await cadastrar('Org', 35);
      await cadastrar('Teen', 15);
      const a = await novaAtividade(org, { publicoAlvo: 'adultos', visibilidade: 'PRIVADA' });
      const res = await request(app).post(`/api/atividades/${a.id}/convites`).set(org.auth).send({ email: 'teen@exemplo.com' });
      expect(res.status).toBe(409);
      expect(res.body.erro).toBe('Não é possível convidar Teen: esta atividade é só para maiores de 18 anos');
    });
  });

  // ---------------------------------------------------------- RF12 – RF14
  describe('avaliações da atividade e dos participantes', () => {
    test('concluir avisa os confirmados; participante avalia uma vez; quem não participou não avalia', async () => {
      const org = await cadastrar('Org', 35);
      const joao = await cadastrar('Joao', 25);
      const maria = await cadastrar('Maria', 25);
      const a = await novaAtividade(org);
      await entrarNaAtividade(org, joao, a);
      const avaliar = (quem, nota) => request(app).post(`/api/atividades/${a.id}/avaliacoes`).set(quem.auth)
        .send({ nota, comentario: 'Muito bom!' });

      expect((await avaliar(joao, 5)).status).toBe(409); // ainda não concluída
      expect((await concluir(org, a)).body.status).toBe('CONCLUIDA');
      expect((await notificacoes(joao))[0]).toMatchObject({
        tipo: 'AVALIE_ATIVIDADE', atividadeId: a.id, mensagem: '"Basquete no Ibirapuera" foi concluída. Conte como foi: avalie a atividade',
      });

      const ok = await avaliar(joao, 5);
      expect(ok.status).toBe(201);
      expect(ok.body).toMatchObject({ nota: 5, comentario: 'Muito bom!', autor: { id: joao.id, nome: 'Joao' } });
      expect((await avaliar(joao, 4)).status).toBe(409);
      expect((await avaliar(maria, 4)).status).toBe(403);
      expect((await avaliar(org, 4)).status).toBe(403);
      expect((await request(app).post(`/api/atividades/${a.id}/avaliacoes`).set(joao.auth).send({ nota: 9 })).status).toBe(400);

      expect((await notificacoes(org))[0]).toMatchObject({ tipo: 'AVALIACAO_RECEBIDA', mensagem: 'Joao avaliou "Basquete no Ibirapuera" com 5 estrelas' });

      const lista = (await request(app).get(`/api/atividades/${a.id}/avaliacoes`).set(maria.auth)).body;
      expect(lista).toMatchObject({ media: 5, total: 1, minhaAvaliacao: null, possoAvaliar: false });
      expect(lista.avaliacoes[0]).toMatchObject({ nota: 5, autor: { nome: 'Joao' } });
      expect((await request(app).get(`/api/atividades/${a.id}/avaliacoes`).set(joao.auth)).body)
        .toMatchObject({ minhaAvaliacao: { nota: 5 }, possoAvaliar: true });
    });

    test('organizador avalia participante; nota aparece na lista dele, na notificação e na reputação', async () => {
      const org = await cadastrar('Org', 35);
      const joao = await cadastrar('Joao', 25);
      const maria = await cadastrar('Maria', 25);
      const a = await novaAtividade(org);
      await entrarNaAtividade(org, joao, a);
      const avaliar = (quem, alvo) => request(app).post(`/api/atividades/${a.id}/participantes/${alvo.id}/avaliacao`)
        .set(quem.auth).send({ nota: 4 });

      expect((await avaliar(org, joao)).status).toBe(409); // antes de concluir
      await concluir(org, a);
      expect((await avaliar(joao, joao)).status).toBe(403);
      expect((await avaliar(org, maria)).status).toBe(409);
      expect((await avaliar(org, joao)).status).toBe(201);
      expect((await avaliar(org, joao)).status).toBe(409);

      const solicitacoes = (await request(app).get(`/api/atividades/${a.id}/participacoes`).set(org.auth)).body;
      expect(solicitacoes[0]).toMatchObject({ usuarioId: joao.id, notaDoOrganizador: 4 });
      expect((await notificacoes(joao))[0].mensagem).toBe('Org avaliou sua participação em "Basquete no Ibirapuera" com 4 estrelas');
      expect((await request(app).get('/api/usuarios/me').set(joao.auth)).body.reputacao).toEqual({ media: 4, total: 1 });
      expect((await request(app).get('/api/usuarios/me').set(maria.auth)).body.reputacao).toEqual({ media: null, total: 0 });
    });

    test('avaliações de atividade privada só para quem pode vê-la', async () => {
      const org = await cadastrar('Org', 35);
      const estranho = await cadastrar('Estranho', 25);
      const a = await novaAtividade(org, { visibilidade: 'PRIVADA' });
      expect((await request(app).get(`/api/atividades/${a.id}/avaliacoes`).set(estranho.auth)).status).toBe(404);
      expect((await request(app).get(`/api/atividades/${a.id}/avaliacoes`).set(org.auth)).status).toBe(200);
    });
  });

  // ---------------------------------------------------------- RF15 – RF18
  describe('comunidades: campos, vagas, mural e avaliação', () => {
    const corredores = (extra = {}) => ({
      nome: 'Corredores da Paulista', descricao: 'Treinos aos sábados', modalidade: 'corrida', publicoAlvo: 'todos', vagasMaximas: 2, ...extra,
    });

    test('campos novos, filtros, vagas e lotação', async () => {
      const dono = await cadastrar('Dono', 35);
      const joao = await cadastrar('Joao', 25);
      const maria = await cadastrar('Maria', 25);
      const criada = await request(app).post('/api/comunidades').set(dono.auth).send(corredores());
      expect(criada.status).toBe(201);
      expect(criada.body).toMatchObject({
        modalidade: 'corrida', publicoAlvo: 'todos', vagasMaximas: 2, vagas: 1, totalMembros: 1,
      });
      await request(app).post('/api/comunidades').set(dono.auth).send({ nome: 'Crochê SP', descricao: 'Sem limite' });

      const porModalidade = await request(app).get('/api/comunidades?modalidade=Corrida').set(joao.auth);
      expect(porModalidade.body.map((c) => c.nome)).toEqual(['Corredores da Paulista']);
      expect((await request(app).get('/api/comunidades?comVaga=true').set(joao.auth)).body).toHaveLength(2);

      expect((await request(app).post(`/api/comunidades/${criada.body.id}/membros`).set(joao.auth)).body).toMatchObject({ vagas: 0 });
      const lotada = await request(app).post(`/api/comunidades/${criada.body.id}/membros`).set(maria.auth);
      expect(lotada.status).toBe(409);
      expect(lotada.body.erro).toBe('Comunidade sem vagas');
      expect((await request(app).get('/api/comunidades?comVaga=true').set(maria.auth)).body.map((c) => c.nome)).toEqual(['Crochê SP']);
    });

    test('comunidade para adultos: menor não vê nem entra', async () => {
      const dono = await cadastrar('Dono', 35);
      const teen = await cadastrar('Teen', 15);
      const { body: c } = await request(app).post('/api/comunidades').set(dono.auth).send(corredores({ publicoAlvo: 'adultos' }));
      expect((await request(app).get('/api/comunidades').set(teen.auth)).body).toEqual([]);
      const res = await request(app).post(`/api/comunidades/${c.id}/membros`).set(teen.auth);
      expect(res.status).toBe(403);
      expect(res.body.erro).toBe('Esta comunidade é só para maiores de 18 anos');
    });

    test('mural: só membros leem e escrevem, com o nome do autor', async () => {
      const dono = await cadastrar('Dono', 35);
      const joao = await cadastrar('Joao', 25);
      const { body: c } = await request(app).post('/api/comunidades').set(dono.auth).send(corredores());
      const mural = `/api/comunidades/${c.id}/mensagens`;

      expect((await request(app).get(mural).set(joao.auth)).status).toBe(403);
      expect((await request(app).post(mural).set(joao.auth).send({ conteudo: 'oi' })).status).toBe(403);

      await request(app).post(`/api/comunidades/${c.id}/membros`).set(joao.auth);
      const enviada = await request(app).post(mural).set(joao.auth).send({ conteudo: '  Bora treinar sábado?  ' });
      expect(enviada.status).toBe(201);
      expect(enviada.body).toMatchObject({ conteudo: 'Bora treinar sábado?', autor: { id: joao.id, nome: 'Joao' } });
      expect((await request(app).post(mural).set(dono.auth).send({ conteudo: '' })).status).toBe(400);
      await request(app).post(mural).set(dono.auth).send({ conteudo: 'Bora! 7h na Paulista.' });

      const lidas = (await request(app).get(mural).set(dono.auth)).body;
      expect(lidas.map((m) => [m.autor.nome, m.conteudo])).toEqual([['Joao', 'Bora treinar sábado?'], ['Dono', 'Bora! 7h na Paulista.']]);
    });

    test('avaliar a comunidade só depois de 3 meses como membro; o criador não avalia (RF18)', async () => {
      const dono = await cadastrar('Dono', 35);
      const joao = await cadastrar('Joao', 25);
      const { body: c } = await request(app).post('/api/comunidades').set(dono.auth).send(corredores({ visibilidade: 'PRIVADA' }));
      await request(app).post(`/api/comunidades/${c.id}/membros`).set(joao.auth);
      agora = new Date('2026-11-20T12:00:00Z'); // aprovado 4 dias depois do pedido: os 3 meses contam daqui
      await request(app).patch(`/api/comunidades/${c.id}/membros/${joao.id}`).set(dono.auth).send({ decisao: 'ACEITAR' });

      const avaliar = (quem) => request(app).post(`/api/comunidades/${c.id}/avaliacoes`).set(quem.auth).send({ nota: 5 });
      const cedo = await avaliar(joao);
      expect(cedo.status).toBe(409);
      expect(cedo.body.erro).toContain('20/02/2027');
      expect((await avaliar(dono)).status).toBe(409);
      expect((await request(app).get(`/api/comunidades/${c.id}/avaliacoes`).set(joao.auth)).body.possoAvaliarEm)
        .toBe('2027-02-20T12:00:00.000Z');

      agora = new Date('2027-02-20T12:00:00Z');
      expect((await avaliar(joao)).status).toBe(201);
      expect((await request(app).get(`/api/comunidades/${c.id}/avaliacoes`).set(dono.auth)).body).toMatchObject({ media: 5, total: 1 });
      expect((await notificacoes(dono))[0].mensagem).toBe('Joao avaliou a comunidade "Corredores da Paulista" com 5 estrelas');
    });
  });

  // ------------------------------------------------------------------ CORS
  test('CORS libera só a origem configurada', async () => {
    const ok = await request(app).options('/api/atividades').set({ Origin: 'https://topa-ai.vercel.app' });
    expect(ok.status).toBe(204);
    expect(ok.headers['access-control-allow-origin']).toBe('https://topa-ai.vercel.app');
    const outro = await request(app).options('/api/atividades').set({ Origin: 'https://site-estranho.com' });
    expect(outro.status).toBe(403);
    expect(outro.headers['access-control-allow-origin']).toBeUndefined();
    expect((await request(app).get('/health')).status).toBe(200);
  });
});
