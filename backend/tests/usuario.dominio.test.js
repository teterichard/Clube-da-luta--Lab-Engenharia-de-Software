const {
  validarCadastro,
  validarLogin,
  validarAtualizacaoPerfil,
  semSenha,
} = require('../src/domain/usuario');

const valido = (extra = {}) => ({
  nome: 'Ângela Souza',
  email: '  Angela@Exemplo.com ',
  senha: 'segredo123',
  ...extra,
});

const campos = (fn) => {
  try {
    fn();
  } catch (e) {
    return e.detalhes.map((d) => d.campo);
  }
  throw new Error('deveria ter lançado ErroValidacao');
};

describe('Domínio Usuário — cadastro (RF01)', () => {
  test('normaliza e-mail e não devolve a senha', () => {
    const u = validarCadastro(valido());
    expect(u).toEqual({ nome: 'Ângela Souza', email: 'angela@exemplo.com' });
  });

  test('aceita campos opcionais do perfil', () => {
    const u = validarCadastro(valido({ localizacao: 'São Paulo', idade: 28, proficiencia: 'Iniciante' }));
    expect(u).toMatchObject({ localizacao: 'São Paulo', idade: 28, proficiencia: 'iniciante' });
  });

  test('lista todos os campos inválidos de uma vez', () => {
    expect(campos(() => validarCadastro({ nome: 'A', email: 'sem-arroba', senha: '123' })))
      .toEqual(['nome', 'email', 'senha']);
  });

  test('senha precisa ter pelo menos 8 caracteres', () => {
    expect(campos(() => validarCadastro(valido({ senha: '1234567' })))).toEqual(['senha']);
    expect(() => validarCadastro(valido({ senha: '12345678' }))).not.toThrow();
  });

  test('valida idade e proficiência', () => {
    expect(campos(() => validarCadastro(valido({ idade: 9, proficiencia: 'mestre' }))))
      .toEqual(['idade', 'proficiencia']);
  });
});

describe('Domínio Usuário — login e perfil', () => {
  test('login exige e-mail e senha', () => {
    expect(campos(() => validarLogin({}))).toEqual(['email', 'senha']);
    expect(validarLogin({ email: 'A@B.com', senha: 'x' })).toEqual({ email: 'a@b.com', senha: 'x' });
  });

  test('atualização de perfil só leva os campos enviados', () => {
    expect(validarAtualizacaoPerfil({ localizacao: ' Pinheiros ' })).toEqual({ localizacao: 'Pinheiros' });
    expect(validarAtualizacaoPerfil({ idade: null, proficiencia: '' })).toEqual({ idade: null, proficiencia: null });
  });

  test('e-mail e senha não são alteráveis pelo perfil', () => {
    expect(validarAtualizacaoPerfil({ email: 'novo@x.com', senha: 'outra-senha' })).toEqual({});
  });

  test('semSenha remove o hash', () => {
    expect(semSenha({ id: 1, nome: 'A', senhaHash: 'x' })).toEqual({ id: 1, nome: 'A' });
  });
});
