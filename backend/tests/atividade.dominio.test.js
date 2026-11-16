const { criarAtividade } = require('../src/domain/atividade');
const { ErroValidacao } = require('../src/domain/erros');

const AGORA = new Date('2026-10-16T12:00:00-03:00');
const organizador = { id: 1 };

const dadosValidos = () => ({
  titulo: 'Basquete no Ibirapuera',
  descricao: 'Jogo 5x5',
  tipo: 'Basquete',
  nivel: 'iniciante',
  publicoAlvo: 'adultos',
  dataHora: '2026-11-20T18:00:00-03:00',
  local: 'Parque Ibirapuera - quadra 3',
  numeroIntegrantes: 10,
  visibilidade: 'PRIVADA',
});

function camposComErro(fn) {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(ErroValidacao);
    return e.detalhes.map((d) => d.campo);
  }
  throw new Error('Era esperado ErroValidacao');
}

describe('Domínio — criarAtividade (UC 5.2)', () => {
  test('dados válidos geram atividade AGENDADA do organizador (RN07, RN08)', () => {
    const a = criarAtividade(dadosValidos(), organizador, AGORA);
    expect(a.status).toBe('AGENDADA');
    expect(a.organizadorId).toBe(1);
    expect(a.tipo).toBe('basquete');
    expect(a.visibilidade).toBe('PRIVADA');
    expect(a.dataHora).toBeInstanceOf(Date);
  });

  test('visibilidade ausente vira PUBLICA (RN06)', () => {
    const dados = dadosValidos();
    delete dados.visibilidade;
    expect(criarAtividade(dados, organizador, AGORA).visibilidade).toBe('PUBLICA');
  });

  test('status e organizadorId enviados pelo cliente são ignorados (RN08)', () => {
    const a = criarAtividade({ ...dadosValidos(), status: 'CONCLUIDA', organizadorId: 99 }, organizador, AGORA);
    expect(a.status).toBe('AGENDADA');
    expect(a.organizadorId).toBe(1);
  });

  test.each([
    ['titulo', { titulo: '' }],
    ['titulo', { titulo: 'ab' }],
    ['titulo', { titulo: 'x'.repeat(101) }],
    ['descricao', { descricao: 'x'.repeat(501) }],
    ['tipo', { tipo: '  ' }],
    ['publicoAlvo', { publicoAlvo: undefined }],
    ['local', { local: '' }],
    ['nivel', { nivel: 'profissional' }],
    ['dataHora', { dataHora: 'amanhã' }],
    ['dataHora', { dataHora: '2026-10-01T10:00:00-03:00' }],
    ['numeroIntegrantes', { numeroIntegrantes: 1 }],
    ['numeroIntegrantes', { numeroIntegrantes: 2.5 }],
    ['numeroIntegrantes', { numeroIntegrantes: '10' }],
    ['visibilidade', { visibilidade: 'SECRETA' }],
  ])('campo %s inválido em %p', (campo, alteracao) => {
    expect(camposComErro(() => criarAtividade({ ...dadosValidos(), ...alteracao }, organizador, AGORA)))
      .toEqual([campo]);
  });

  test('sem organizador é inválido', () => {
    expect(camposComErro(() => criarAtividade(dadosValidos(), null, AGORA))).toContain('organizador');
  });

  test('lista todos os erros de uma vez (CA-10)', () => {
    const campos = camposComErro(() => criarAtividade({}, organizador, AGORA));
    expect(campos).toEqual(expect.arrayContaining(
      ['titulo', 'tipo', 'publicoAlvo', 'local', 'nivel', 'dataHora', 'numeroIntegrantes'],
    ));
  });
});

describe('Editar atividade (RF04)', () => {
  const { editarAtividade } = require('../src/domain/atividade');
  const { ErroProibido, ErroRegraNegocio } = require('../src/domain/erros');
  const atual = () => ({ id: 7, ...criarAtividade(dadosValidos(), organizador, AGORA) });

  test('altera só os campos enviados e marca atualizadaEm', () => {
    const editada = editarAtividade(atual(), { titulo: 'Basquete 3x3', numeroIntegrantes: 6 }, organizador, 0, AGORA);
    expect(editada).toMatchObject({ id: 7, titulo: 'Basquete 3x3', numeroIntegrantes: 6, local: 'Parque Ibirapuera - quadra 3' });
    expect(editada.atualizadaEm).toBe(AGORA);
  });

  test('ignora status e organizadorId vindos do cliente', () => {
    const editada = editarAtividade(atual(), { status: 'CONCLUIDA', organizadorId: 99 }, organizador, 0, AGORA);
    expect(editada.status).toBe('AGENDADA');
    expect(editada.organizadorId).toBe(1);
  });

  test('só o organizador edita', () => {
    expect(() => editarAtividade(atual(), { titulo: 'Outro' }, { id: 2 }, 0, AGORA)).toThrow(ErroProibido);
  });

  test('só edita atividade agendada', () => {
    expect(() => editarAtividade({ ...atual(), status: 'CANCELADA' }, {}, organizador, 0, AGORA))
      .toThrow(ErroRegraNegocio);
  });

  test('não deixa o número de integrantes abaixo dos aceitos', () => {
    expect(camposComErro(() => editarAtividade(atual(), { numeroIntegrantes: 3 }, organizador, 4, AGORA)))
      .toEqual(['numeroIntegrantes']);
  });

  test('nova data precisa ser no futuro, mas manter a data atual não é revalidado', () => {
    expect(camposComErro(() => editarAtividade(atual(), { dataHora: '2026-01-01T10:00:00-03:00' }, organizador, 0, AGORA)))
      .toEqual(['dataHora']);
    const depois = new Date('2026-12-01T12:00:00-03:00');
    expect(() => editarAtividade(atual(), { titulo: 'Novo título' }, organizador, 0, depois)).not.toThrow();
  });
});

describe('Ciclo de status (RF11) e exclusão', () => {
  const { mudarStatus, verificarExclusao } = require('../src/domain/atividade');
  const { ErroProibido, ErroRegraNegocio } = require('../src/domain/erros');
  const nova = () => ({ id: 1, ...criarAtividade(dadosValidos(), organizador, AGORA) });

  test('agendada → ativa → concluída', () => {
    const ativa = mudarStatus(nova(), organizador, 'iniciar', AGORA);
    expect(ativa.status).toBe('ATIVA');
    expect(mudarStatus(ativa, organizador, 'concluir', AGORA).status).toBe('CONCLUIDA');
  });

  test('cancelar vale para agendada e ativa, não para concluída ou cancelada', () => {
    expect(mudarStatus(nova(), organizador, 'cancelar', AGORA).status).toBe('CANCELADA');
    expect(mudarStatus({ ...nova(), status: 'ATIVA' }, organizador, 'cancelar', AGORA).status).toBe('CANCELADA');
    expect(() => mudarStatus({ ...nova(), status: 'CONCLUIDA' }, organizador, 'cancelar', AGORA)).toThrow(ErroRegraNegocio);
    expect(() => mudarStatus({ ...nova(), status: 'CANCELADA' }, organizador, 'cancelar', AGORA)).toThrow(ErroRegraNegocio);
  });

  test('não conclui atividade que não começou e não inicia duas vezes', () => {
    expect(() => mudarStatus(nova(), organizador, 'concluir', AGORA)).toThrow(ErroRegraNegocio);
    expect(() => mudarStatus({ ...nova(), status: 'ATIVA' }, organizador, 'iniciar', AGORA)).toThrow(ErroRegraNegocio);
  });

  test('ação desconhecida é 400 e outro usuário é 403', () => {
    expect(() => mudarStatus(nova(), organizador, 'pausar', AGORA)).toThrow(ErroValidacao);
    expect(() => mudarStatus(nova(), { id: 2 }, 'iniciar', AGORA)).toThrow(ErroProibido);
  });

  test('exclusão só sem participantes aceitos', () => {
    expect(() => verificarExclusao(nova(), organizador, 0)).not.toThrow();
    expect(() => verificarExclusao(nova(), organizador, 1)).toThrow(ErroRegraNegocio);
    expect(() => verificarExclusao(nova(), { id: 3 }, 0)).toThrow(ErroProibido);
  });
});
