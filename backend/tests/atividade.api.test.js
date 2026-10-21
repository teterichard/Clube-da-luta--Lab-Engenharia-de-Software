const request = require('supertest');
const jwt = require('jsonwebtoken');
const { criarApp } = require('../src/app');
const { criarAtividadeRepositoryMemoria } = require('../src/repositories/atividadeRepositoryMemoria');

const SEGREDO = 'segredo-de-teste';
const AGORA = new Date('2026-10-16T12:00:00-03:00');

const token = (sub = 7) => jwt.sign({ sub, nome: 'Organizador' }, SEGREDO, { expiresIn: '1h' });

const corpoValido = {
  titulo: 'Basquete no Ibirapuera',
  tipo: 'basquete',
  nivel: 'intermediario',
  publicoAlvo: 'adultos',
  dataHora: '2026-11-20T18:00:00-03:00',
  local: 'Parque Ibirapuera - quadra 3',
  numeroIntegrantes: 10,
};

describe('POST /api/atividades', () => {
  let app;
  let repo;

  beforeEach(() => {
    repo = criarAtividadeRepositoryMemoria();
    app = criarApp({ atividadeRepository: repo, jwtSegredo: SEGREDO, relogio: () => AGORA });
  });

  test('CA-01: cria atividade e retorna 201 com Location', async () => {
    const res = await request(app)
      .post('/api/atividades')
      .set('Authorization', `Bearer ${token(7)}`)
      .send(corpoValido);

    expect(res.status).toBe(201);
    expect(res.headers.location).toBe(`/api/atividades/${res.body.id}`);
    expect(res.body).toMatchObject({
      titulo: 'Basquete no Ibirapuera',
      status: 'AGENDADA',
      visibilidade: 'PUBLICA',
      organizadorId: 7,
    });
    expect(await repo.buscarPorId(res.body.id)).not.toBeNull();
  });

  test('CA-02: sem token retorna 401', async () => {
    const res = await request(app).post('/api/atividades').send(corpoValido);
    expect(res.status).toBe(401);
  });

  test('CA-03: token inválido retorna 401', async () => {
    const forjado = jwt.sign({ sub: 7 }, 'outro-segredo');
    const res = await request(app)
      .post('/api/atividades')
      .set('Authorization', `Bearer ${forjado}`)
      .send(corpoValido);
    expect(res.status).toBe(401);
    expect(res.body.erro).toBe('Token inválido ou expirado');
  });

  test('CA-03: token expirado retorna 401', async () => {
    const expirado = jwt.sign({ sub: 7, exp: Math.floor(Date.now() / 1000) - 60 }, SEGREDO);
    const res = await request(app)
      .post('/api/atividades')
      .set('Authorization', `Bearer ${expirado}`)
      .send(corpoValido);
    expect(res.status).toBe(401);
  });

  test('CA-05/CA-06: dados inválidos retornam 400 com detalhes', async () => {
    const res = await request(app)
      .post('/api/atividades')
      .set('Authorization', `Bearer ${token()}`)
      .send({ ...corpoValido, dataHora: '2020-01-01T10:00:00Z', numeroIntegrantes: 1 });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('Dados inválidos');
    expect(res.body.detalhes.map((d) => d.campo)).toEqual(['dataHora', 'numeroIntegrantes']);
  });

  test('JSON malformado retorna 400', async () => {
    const res = await request(app)
      .post('/api/atividades')
      .set('Authorization', `Bearer ${token()}`)
      .set('Content-Type', 'application/json')
      .send('{ titulo: ');
    expect(res.status).toBe(400);
  });
});
