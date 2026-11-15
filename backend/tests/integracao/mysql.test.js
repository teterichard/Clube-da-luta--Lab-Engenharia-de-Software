const fs = require('fs');
const path = require('path');
const request = require('supertest');
const mysql = require('mysql2/promise');
const { criarApp } = require('../../src/app');
const { criarRepositoriosMySQL } = require('../../src/repositories/mysql');

/**
 * Integração com MySQL de verdade (repositórios + trava FOR UPDATE).
 * Só roda com DB_TEST=true — veja "npm run test:mysql" e a esteira de CI.
 * Usa um banco próprio (DB_TEST_NAME, padrão topaai_teste), recriado a cada execução.
 */
const habilitado = process.env.DB_TEST === 'true';
const describeMySQL = habilitado ? describe : describe.skip;

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'topaai',
  password: process.env.DB_PASSWORD || 'topaai',
};
const BANCO = process.env.DB_TEST_NAME || 'topaai_teste';

describeMySQL('Integração com MySQL', () => {
  let pool;
  let app;
  let org;
  let ana;
  let bia;
  let carla;

  const cadastrar = async (nome, email) => {
    const res = await request(app).post('/api/auth/cadastro').send({ nome, email, senha: 'senha1234' });
    expect(res.status).toBe(201);
    return { id: res.body.usuario.id, auth: { Authorization: `Bearer ${res.body.token}` } };
  };

  const atividade = (extra = {}) => ({
    titulo: 'Basquete no Ibirapuera',
    tipo: 'basquete',
    nivel: 'iniciante',
    publicoAlvo: 'adultos',
    dataHora: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    local: 'Parque Ibirapuera - quadra 3',
    numeroIntegrantes: 2,
    ...extra,
  });

  beforeAll(async () => {
    const admin = await mysql.createConnection({ ...config, multipleStatements: true });
    await admin.query(`DROP DATABASE IF EXISTS \`${BANCO}\`; CREATE DATABASE \`${BANCO}\`; USE \`${BANCO}\`;`);
    await admin.query(fs.readFileSync(path.join(__dirname, '../../db/schema.sql'), 'utf8'));
    await admin.end();

    pool = mysql.createPool({ ...config, database: BANCO, connectionLimit: 10 });
    app = criarApp({ ...criarRepositoriosMySQL(pool), jwtSegredo: 'segredo-integracao', custoBcrypt: 4 });

    org = await cadastrar('Organizador', 'org@exemplo.com');
    ana = await cadastrar('Ana', 'ana@exemplo.com');
    bia = await cadastrar('Bia', 'bia@exemplo.com');
    carla = await cadastrar('Carla', 'carla@exemplo.com');
  });

  afterAll(async () => {
    if (pool) await pool.end();
  });

  test('login, perfil e e-mail duplicado', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: 'ANA@exemplo.com', senha: 'senha1234' });
    expect(login.status).toBe(200);
    expect((await request(app).post('/api/auth/login').send({ email: 'ana@exemplo.com', senha: 'errada123' })).status).toBe(401);
    expect((await request(app).post('/api/auth/cadastro').send({ nome: 'Ana 2', email: 'ana@exemplo.com', senha: 'senha1234' })).status).toBe(409);

    const perfil = await request(app).patch('/api/usuarios/me').set(ana.auth).send({ localizacao: 'Pinheiros', idade: 25 });
    expect(perfil.body).toMatchObject({ nome: 'Ana', localizacao: 'Pinheiros', idade: 25 });
    expect(perfil.body).not.toHaveProperty('senhaHash');
  });

  test('cria, filtra, edita e lista atividades', async () => {
    const criada = await request(app).post('/api/atividades').set(org.auth).send(atividade());
    expect(criada.status).toBe(201);

    const lista = await request(app).get('/api/atividades?tipo=basquete&local=ibirapuera').set(ana.auth);
    expect(lista.body.map((a) => a.id)).toContain(criada.body.id);

    const editada = await request(app).patch(`/api/atividades/${criada.body.id}`).set(org.auth).send({ local: 'Quadra 5' });
    expect(editada.body.local).toBe('Quadra 5');

    const organizadas = await request(app).get('/api/atividades/organizadas').set(org.auth);
    expect(organizadas.body.find((a) => a.id === criada.body.id)).toMatchObject({ vagas: 2, pendentes: 0 });
  });

  test('aceites simultâneos respeitam o limite (SELECT ... FOR UPDATE)', async () => {
    const { body: a } = await request(app).post('/api/atividades').set(org.auth).send(atividade());
    const pedidos = [];
    for (const u of [ana, bia, carla]) {
      pedidos.push((await request(app).post(`/api/atividades/${a.id}/participacoes`).set(u.auth)).body);
    }

    const respostas = await Promise.all(pedidos.map((p) => request(app)
      .patch(`/api/participacoes/${p.id}`).set(org.auth).send({ decisao: 'ACEITAR' })));
    expect(respostas.map((r) => r.status).sort()).toEqual([200, 200, 409]);

    const detalhe = await request(app).get(`/api/atividades/${a.id}`).set(org.auth);
    expect(detalhe.body.vagas).toBe(0);
    const [linhas] = await pool.query("SELECT COUNT(*) AS n FROM participacao WHERE atividade_id = ? AND status = 'ACEITO'", [a.id]);
    expect(Number(linhas[0].n)).toBe(2);
  });

  test('convite em atividade privada, minhas inscrições e cancelamento', async () => {
    const { body: a } = await request(app).post('/api/atividades').set(org.auth).send(atividade({ visibilidade: 'PRIVADA' }));
    expect((await request(app).get(`/api/atividades/${a.id}`).set(bia.auth)).status).toBe(404);

    const convite = await request(app).post(`/api/atividades/${a.id}/convites`).set(org.auth).send({ email: 'bia@exemplo.com' });
    expect(convite.status).toBe(201);
    expect((await request(app).get(`/api/atividades/${a.id}`).set(bia.auth)).status).toBe(200);

    const aceito = await request(app).patch(`/api/convites/${convite.body.id}`).set(bia.auth).send({ decisao: 'ACEITAR' });
    expect(aceito.body.status).toBe('ACEITO');

    const minhas = await request(app).get('/api/participacoes/minhas').set(bia.auth);
    const inscricao = minhas.body.find((p) => p.atividadeId === a.id);
    expect(inscricao).toMatchObject({ status: 'ACEITO', atividade: { titulo: a.titulo } });

    const cancelada = await request(app).post(`/api/participacoes/${inscricao.id}/cancelar`).set(bia.auth);
    expect(cancelada.body.status).toBe('CANCELADO');
    expect((await request(app).get(`/api/atividades/${a.id}`).set(org.auth)).body.vagas).toBe(2);
  });

  test('notificações gravadas pelos eventos e marcadas como lidas', async () => {
    const { body: a } = await request(app).post('/api/atividades').set(org.auth).send(atividade());
    await request(app).post(`/api/atividades/${a.id}/participacoes`).set(carla.auth);

    const lista = await request(app).get('/api/notificacoes?naoLidas=true').set(org.auth);
    const aviso = lista.body.itens.find((n) => n.atividadeId === a.id);
    expect(aviso).toMatchObject({ tipo: 'SOLICITACAO_RECEBIDA', lida: false, mensagem: `Carla pediu para participar de "${a.titulo}"` });

    expect((await request(app).patch(`/api/notificacoes/${aviso.id}/lida`).set(org.auth)).body.lida).toBe(true);
    await request(app).post('/api/notificacoes/lidas').set(org.auth);
    expect((await request(app).get('/api/notificacoes').set(org.auth)).body.naoLidas).toBe(0);
  });

  test('ciclo de status e exclusão em cascata', async () => {
    const { body: a } = await request(app).post('/api/atividades').set(org.auth).send(atividade());
    expect((await request(app).post(`/api/atividades/${a.id}/iniciar`).set(org.auth)).body.status).toBe('ATIVA');
    expect((await request(app).post(`/api/atividades/${a.id}/concluir`).set(org.auth)).body.status).toBe('CONCLUIDA');

    const { body: b } = await request(app).post('/api/atividades').set(org.auth).send(atividade());
    await request(app).post(`/api/atividades/${b.id}/participacoes`).set(ana.auth);
    await request(app).post(`/api/atividades/${b.id}/convites`).set(org.auth).send({ email: 'carla@exemplo.com' });
    expect((await request(app).delete(`/api/atividades/${b.id}`).set(org.auth)).status).toBe(204);
    const [restantes] = await pool.query(
      'SELECT (SELECT COUNT(*) FROM participacao WHERE atividade_id = ?) AS p, (SELECT COUNT(*) FROM convite WHERE atividade_id = ?) AS c',
      [b.id, b.id],
    );
    expect(restantes[0]).toEqual({ p: 0, c: 0 });
  });
});
