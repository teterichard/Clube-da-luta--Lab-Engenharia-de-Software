const request = require('supertest');
const jwt = require('jsonwebtoken');
const { criarApp } = require('../src/app');

/** UC Autenticação — RF01 (cadastro), RF02 (login) e perfil do usuário logado. */
const SEGREDO = 'segredo-de-teste';

const cadastro = (extra = {}) => ({
  nome: 'Francisco Lima',
  email: 'francisco@exemplo.com',
  senha: 'senhaForte1',
  ...extra,
});

describe('Autenticação — API', () => {
  let app;

  beforeEach(() => {
    // custo baixo do bcrypt para os testes ficarem rápidos
    app = criarApp({ jwtSegredo: SEGREDO, custoBcrypt: 4 });
  });

  const cadastrar = (extra) => request(app).post('/api/auth/cadastro').send(cadastro(extra));
  const login = (email, senha) => request(app).post('/api/auth/login').send({ email, senha });

  test('CA-01: cadastro devolve 201, token válido e usuário sem a senha', async () => {
    const res = await cadastrar();
    expect(res.status).toBe(201);
    expect(res.body.usuario).toMatchObject({ id: 1, nome: 'Francisco Lima', email: 'francisco@exemplo.com' });
    expect(res.body.usuario).not.toHaveProperty('senhaHash');
    expect(res.body.usuario).not.toHaveProperty('senha');

    const payload = jwt.verify(res.body.token, SEGREDO);
    expect(payload).toMatchObject({ sub: 1, nome: 'Francisco Lima' });
    expect(payload.exp).toBeGreaterThan(payload.iat);
  });

  test('CA-02: e-mail já cadastrado (sem diferenciar maiúsculas) devolve 409', async () => {
    await cadastrar();
    const res = await cadastrar({ email: 'FRANCISCO@exemplo.com' });
    expect(res.status).toBe(409);
  });

  test('CA-03: dados inválidos devolvem 400 com a lista de campos', async () => {
    const res = await request(app).post('/api/auth/cadastro').send({ nome: '', email: 'x', senha: '1' });
    expect(res.status).toBe(400);
    expect(res.body.detalhes.map((d) => d.campo)).toEqual(['nome', 'email', 'senha']);
  });

  test('CA-04: login com a senha certa devolve token', async () => {
    await cadastrar();
    const res = await login('Francisco@Exemplo.com', 'senhaForte1');
    expect(res.status).toBe(200);
    expect(jwt.verify(res.body.token, SEGREDO).sub).toBe(1);
  });

  test('CA-05: senha errada e e-mail inexistente devolvem a mesma mensagem 401', async () => {
    await cadastrar();
    const senhaErrada = await login('francisco@exemplo.com', 'outra-senha');
    const naoExiste = await login('ninguem@exemplo.com', 'senhaForte1');
    expect(senhaErrada.status).toBe(401);
    expect(naoExiste.status).toBe(401);
    expect(senhaErrada.body.erro).toBe(naoExiste.body.erro);
  });

  test('CA-06: token do login dá acesso às rotas protegidas', async () => {
    const { body } = await cadastrar();
    const res = await request(app).get('/api/atividades').set('Authorization', `Bearer ${body.token}`);
    expect(res.status).toBe(200);
  });

  test('CA-07: GET /me exige login e devolve o perfil', async () => {
    const { body } = await cadastrar({ localizacao: 'Pinheiros', proficiencia: 'iniciante' });
    expect((await request(app).get('/api/usuarios/me')).status).toBe(401);

    const res = await request(app).get('/api/usuarios/me').set('Authorization', `Bearer ${body.token}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ nome: 'Francisco Lima', localizacao: 'Pinheiros', proficiencia: 'iniciante' });
    expect(res.body).not.toHaveProperty('senhaHash');
  });

  test('CA-08: PATCH /me atualiza o perfil e ignora e-mail', async () => {
    const { body } = await cadastrar();
    const auth = { Authorization: `Bearer ${body.token}` };

    const res = await request(app).patch('/api/usuarios/me').set(auth)
      .send({ nome: 'Chico', idade: 34, email: 'outro@x.com' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ nome: 'Chico', idade: 34, email: 'francisco@exemplo.com' });

    const invalido = await request(app).patch('/api/usuarios/me').set(auth).send({ idade: 5 });
    expect(invalido.status).toBe(400);
  });
});
