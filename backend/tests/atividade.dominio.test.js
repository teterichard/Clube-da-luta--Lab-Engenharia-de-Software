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
