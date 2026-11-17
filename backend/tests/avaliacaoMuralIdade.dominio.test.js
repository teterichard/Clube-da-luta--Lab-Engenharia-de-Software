const { idadePermite, verificarFaixaEtaria } = require('../src/domain/faixaEtaria');
const { criarAvaliacao, resumir, podeAvaliarComunidadeEm } = require('../src/domain/avaliacao');
const {
  criarComunidade, editarComunidade, entrar, responderPedido, calcularVagas, criarMensagem,
} = require('../src/domain/comunidade');
const { ErroProibido, ErroRegraNegocio, ErroValidacao } = require('../src/domain/erros');

const AGORA = new Date('2026-11-16T12:00:00Z');
const campos = (fn) => {
  try { fn(); } catch (e) { return e.detalhes.map((d) => d.campo); }
  throw new Error('não lançou erro');
};

describe('Faixa etária (RF19 / RNF08)', () => {
  test('"adultos" só 18+, "menores" só menores; outros públicos livres', () => {
    expect(idadePermite('adultos', 18)).toBe(true);
    expect(idadePermite('Adultos', 17)).toBe(false);
    expect(idadePermite('menores', 17)).toBe(true);
    expect(idadePermite('menores', 18)).toBe(false);
    expect(idadePermite('todos', 13)).toBe(true);
    expect(idadePermite('adultos', null)).toBe(true); // busca não esconde quem não informou
  });

  test('fora da faixa é 403; sem idade no perfil é 409 pedindo para informar', () => {
    expect(() => verificarFaixaEtaria('adultos', { idade: 15 })).toThrow(ErroProibido);
    expect(() => verificarFaixaEtaria('adultos', { idade: 15 })).toThrow('Esta atividade é só para maiores de 18 anos');
    expect(() => verificarFaixaEtaria('menores', { idade: 30 }, 'comunidade')).toThrow('Esta comunidade é só para menores de 18 anos');
    expect(() => verificarFaixaEtaria('adultos', { idade: null })).toThrow(ErroRegraNegocio);
    expect(() => verificarFaixaEtaria('adultos', {})).toThrow('Informe sua idade no perfil');
    expect(() => verificarFaixaEtaria('todos', {})).not.toThrow();
    expect(() => verificarFaixaEtaria(null, { idade: 15 })).not.toThrow();
  });
});

describe('Avaliações (RF12–RF14, RF18)', () => {
  const chave = { autorId: 1, tipo: 'ATIVIDADE', alvoId: 9, agora: AGORA };

  test('nota inteira de 1 a 5, comentário opcional e limpo', () => {
    expect(criarAvaliacao({ ...chave, dados: { nota: 5, comentario: '  Top!  ' }, jaAvaliou: false }))
      .toMatchObject({ nota: 5, comentario: 'Top!', contextoId: 0, criadaEm: AGORA });
    expect(criarAvaliacao({ ...chave, dados: { nota: 1 }, jaAvaliou: false }).comentario).toBeNull();
    expect(campos(() => criarAvaliacao({ ...chave, dados: { nota: 0 }, jaAvaliou: false }))).toEqual(['nota']);
    expect(campos(() => criarAvaliacao({ ...chave, dados: { nota: 4.5, comentario: 'x'.repeat(501) }, jaAvaliou: false })))
      .toEqual(['nota', 'comentario']);
  });

  test('não avalia duas vezes; média com uma casa', () => {
    expect(() => criarAvaliacao({ ...chave, dados: { nota: 3 }, jaAvaliou: true })).toThrow('Você já fez essa avaliação');
    expect(resumir([{ nota: 5 }, { nota: 4 }, { nota: 4 }])).toEqual({ media: 4.3, total: 3 });
    expect(resumir([])).toEqual({ media: null, total: 0 });
  });

  test('comunidade pode ser avaliada 3 meses depois da entrada', () => {
    expect(podeAvaliarComunidadeEm('2026-08-16T12:00:00Z').toISOString()).toBe('2026-11-16T12:00:00.000Z');
  });
});

describe('Comunidade — campos do caso de uso, vagas e mural (RF15, RF17)', () => {
  const ADMIN = { id: 1 };
  const dados = {
    nome: 'Corredores da Paulista', descricao: 'Treinos aos sábados', modalidade: ' Corrida ', publicoAlvo: 'ADULTOS', vagasMaximas: 2,
  };
  const comunidade = { id: 7, ...criarComunidade(dados, ADMIN, AGORA) };
  const admin = { comunidadeId: 7, usuarioId: 1, papel: 'ADMIN', status: 'ATIVO' };

  test('modalidade e público normalizados; limite opcional validado', () => {
    expect(comunidade).toMatchObject({ modalidade: 'corrida', publicoAlvo: 'adultos', vagasMaximas: 2 });
    expect(criarComunidade({ nome: 'Crochê', descricao: 'x' }, ADMIN, AGORA).vagasMaximas).toBeNull();
    expect(campos(() => criarComunidade({ nome: 'Crochê', descricao: 'x', vagasMaximas: 1 }, ADMIN, AGORA)))
      .toEqual(['vagasMaximas']);
  });

  test('lotada: não entra nem é aprovada; limite não fica abaixo dos membros', () => {
    const cheia = [admin, { comunidadeId: 7, usuarioId: 2, papel: 'MEMBRO', status: 'ATIVO' }];
    expect(calcularVagas(comunidade, cheia)).toBe(0);
    expect(() => entrar(comunidade, cheia, { id: 3 }, AGORA)).toThrow('Comunidade sem vagas');

    const privada = { ...comunidade, visibilidade: 'PRIVADA' };
    const comPedido = [...cheia, { comunidadeId: 7, usuarioId: 3, papel: 'MEMBRO', status: 'PENDENTE' }];
    expect(() => responderPedido(comPedido, ADMIN, 3, 'ACEITAR', privada)).toThrow('Comunidade sem vagas');
    expect(responderPedido(comPedido, ADMIN, 3, 'RECUSAR', privada)).toBeNull();

    expect(campos(() => editarComunidade(comunidade, { vagasMaximas: 2 }, [...cheia, { usuarioId: 4, status: 'ATIVO' }], ADMIN)))
      .toEqual(['vagasMaximas']);
    expect(calcularVagas({ vagasMaximas: null }, cheia)).toBeNull();
  });

  test('mural: só membro ativo escreve; conteúdo de 1 a 500 caracteres', () => {
    const pendente = { comunidadeId: 7, usuarioId: 5, status: 'PENDENTE' };
    expect(() => criarMensagem(comunidade, [admin, pendente], { id: 5 }, 'oi', AGORA)).toThrow(ErroProibido);
    expect(() => criarMensagem(comunidade, [admin], { id: 1 }, '   ', AGORA)).toThrow(ErroValidacao);
    expect(criarMensagem(comunidade, [admin], { id: 1 }, '  Bora treinar!  ', AGORA))
      .toEqual({
        comunidadeId: 7, autorId: 1, conteudo: 'Bora treinar!', enviadaEm: AGORA,
      });
  });
});
