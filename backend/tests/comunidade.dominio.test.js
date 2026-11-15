const {
  criarComunidade,
  editarComunidade,
  entrar,
  sair,
  responderPedido,
  promover,
  membrosVisiveis,
} = require('../src/domain/comunidade');
const {
  ErroValidacao,
  ErroProibido,
  ErroRegraNegocio,
  ErroNaoEncontrado,
} = require('../src/domain/erros');

const AGORA = new Date('2026-11-10T12:00:00-03:00');
const ADMIN = { id: 1 };
const ANA = { id: 2 };
const BIA = { id: 3 };

const comunidade = (extra = {}) => ({ id: 5, nome: 'Crochê SP', descricao: 'Encontros mensais', visibilidade: 'PUBLICA', ...extra });
const m = (usuarioId, status = 'ATIVO', papel = 'MEMBRO') => ({ comunidadeId: 5, usuarioId, status, papel });
const base = () => [m(1, 'ATIVO', 'ADMIN')];

const campos = (fn) => {
  try { fn(); } catch (e) { return e.detalhes.map((d) => d.campo); }
  throw new Error('deveria lançar');
};

describe('Comunidade — criar e editar', () => {
  test('cria pública por padrão, guardando o criador', () => {
    expect(criarComunidade({ nome: ' Basquete da Zona Sul ', descricao: 'Jogos aos sábados' }, ADMIN, AGORA)).toEqual({
      nome: 'Basquete da Zona Sul', descricao: 'Jogos aos sábados', visibilidade: 'PUBLICA', criadorId: 1, criadaEm: AGORA,
    });
  });

  test('nome, descrição e visibilidade validados (como na classe Java)', () => {
    expect(campos(() => criarComunidade({ nome: 'ab', descricao: '', visibilidade: 'secreta' }, ADMIN, AGORA)))
      .toEqual(['nome', 'descricao', 'visibilidade']);
  });

  test('só admin edita', () => {
    expect(editarComunidade(comunidade(), { visibilidade: 'privada' }, base(), ADMIN).visibilidade).toBe('PRIVADA');
    expect(() => editarComunidade(comunidade(), { nome: 'Outro' }, [...base(), m(2)], ANA)).toThrow(ErroProibido);
    expect(() => editarComunidade(comunidade(), { nome: 'x' }, base(), ADMIN)).toThrow(ErroValidacao);
  });
});

describe('Comunidade — membros', () => {
  test('pública: entra direto; privada: fica pendente', () => {
    expect(entrar(comunidade(), base(), ANA, AGORA)).toMatchObject({ usuarioId: 2, status: 'ATIVO', papel: 'MEMBRO' });
    expect(entrar(comunidade({ visibilidade: 'PRIVADA' }), base(), ANA, AGORA).status).toBe('PENDENTE');
  });

  test('não entra duas vezes', () => {
    expect(() => entrar(comunidade(), [...base(), m(2)], ANA, AGORA)).toThrow('Você já faz parte desta comunidade');
    expect(() => entrar(comunidade(), [...base(), m(2, 'PENDENTE')], ANA, AGORA)).toThrow('aguardando aprovação');
  });

  test('sair: membro sai; quem não é membro 404; único admin não sai', () => {
    expect(sair([...base(), m(2)], ANA)).toMatchObject({ usuarioId: 2 });
    expect(() => sair(base(), ANA)).toThrow(ErroNaoEncontrado);
    expect(() => sair(base(), ADMIN)).toThrow(ErroRegraNegocio);
    expect(() => sair([...base(), m(2, 'ATIVO', 'ADMIN')], ADMIN)).not.toThrow();
  });

  test('admin aprova (ATIVO) ou recusa (remove) pedidos pendentes', () => {
    const membros = [...base(), m(2, 'PENDENTE')];
    expect(responderPedido(membros, ADMIN, 2, 'aceitar')).toMatchObject({ usuarioId: 2, status: 'ATIVO' });
    expect(responderPedido(membros, ADMIN, 2, 'RECUSAR')).toBeNull();
    expect(() => responderPedido(membros, ANA, 2, 'ACEITAR')).toThrow(ErroProibido);
    expect(() => responderPedido(membros, ADMIN, 9, 'ACEITAR')).toThrow(ErroNaoEncontrado);
    expect(() => responderPedido([...base(), m(2)], ADMIN, 2, 'ACEITAR')).toThrow(ErroRegraNegocio);
    expect(() => responderPedido(membros, ADMIN, 2, 'talvez')).toThrow(ErroValidacao);
  });

  test('admin promove membro ativo', () => {
    expect(promover([...base(), m(2)], ADMIN, 2).papel).toBe('ADMIN');
    expect(() => promover([...base(), m(2, 'PENDENTE')], ADMIN, 2)).toThrow(ErroNaoEncontrado);
    expect(() => promover([...base(), m(2)], ANA, 1)).toThrow(ErroProibido);
  });

  test('membros visíveis: privada só para membros; pendentes só para admin', () => {
    const membros = [...base(), m(2), m(3, 'PENDENTE')];
    const privada = comunidade({ visibilidade: 'PRIVADA' });
    expect(() => membrosVisiveis(privada, membros, BIA)).toThrow(ErroProibido);
    expect(membrosVisiveis(privada, membros, ANA).map((x) => x.usuarioId)).toEqual([1, 2]);
    expect(membrosVisiveis(privada, membros, ADMIN).map((x) => x.usuarioId)).toEqual([1, 2, 3]);
    expect(membrosVisiveis(comunidade(), membros, { id: 99 }).map((x) => x.usuarioId)).toEqual([1, 2]);
  });
});
