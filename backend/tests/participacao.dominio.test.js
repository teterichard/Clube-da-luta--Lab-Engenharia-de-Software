const {
  calcularVagas,
  solicitarParticipacao,
  responderSolicitacao,
} = require('../src/domain/participacao');
const { lerFiltros, aplicarFiltros } = require('../src/domain/filtros');
const {
  ErroRegraNegocio,
  ErroProibido,
  ErroValidacao,
} = require('../src/domain/erros');

const AGORA = new Date('2026-10-27T12:00:00-03:00');
const organizador = { id: 1 };
const joao = { id: 2 };
const maria = { id: 3 };

const atividade = (extra = {}) => ({
  id: 10,
  titulo: 'Futebol no parque',
  tipo: 'futebol',
  nivel: 'iniciante',
  publicoAlvo: 'adultos',
  local: 'Parque Ibirapuera - campo 1',
  dataHora: new Date('2026-11-20T18:00:00-03:00'),
  numeroIntegrantes: 2,
  visibilidade: 'PUBLICA',
  status: 'AGENDADA',
  organizadorId: 1,
  ...extra,
});

const participacao = (usuarioId, status, id = usuarioId * 100) => ({
  id, atividadeId: 10, usuarioId, status,
});

describe('Domínio — vagas', () => {
  test('vagas = integrantes − aceitos (pendentes e rejeitados não contam)', () => {
    const lista = [participacao(2, 'ACEITO'), participacao(3, 'PENDENTE'), participacao(4, 'REJEITADO')];
    expect(calcularVagas(atividade({ numeroIntegrantes: 5 }), lista)).toBe(4);
    expect(calcularVagas(atividade({ numeroIntegrantes: 1 }), [participacao(2, 'ACEITO')])).toBe(0);
  });
});

describe('Domínio — solicitarParticipacao (passo 6)', () => {
  test('CT-01: gera solicitação PENDENTE para o usuário logado', () => {
    const nova = solicitarParticipacao(atividade(), [], joao, AGORA);
    expect(nova).toMatchObject({ atividadeId: 10, usuarioId: 2, status: 'PENDENTE', solicitadaEm: AGORA });
  });

  test('CT-04: atividade sem vagas bloqueia a solicitação', () => {
    const cheia = [participacao(2, 'ACEITO'), participacao(3, 'ACEITO')];
    expect(() => solicitarParticipacao(atividade(), cheia, { id: 4 }, AGORA))
      .toThrow(new ErroRegraNegocio('Atividade sem vagas'));
  });

  test('CT-06: impede solicitação duplicada, mas permite nova após rejeição', () => {
    expect(() => solicitarParticipacao(atividade(), [participacao(2, 'PENDENTE')], joao, AGORA))
      .toThrow('Solicitação já enviada');
    expect(solicitarParticipacao(atividade(), [participacao(2, 'REJEITADO')], joao, AGORA).status)
      .toBe('PENDENTE');
  });

  test('organizador não pode se inscrever na própria atividade (id string ou número)', () => {
    expect(() => solicitarParticipacao(atividade(), [], { id: '1' }, AGORA))
      .toThrow('Organizador não pode se inscrever na própria atividade');
  });

  test('atividade privada só por convite', () => {
    expect(() => solicitarParticipacao(atividade({ visibilidade: 'PRIVADA' }), [], joao, AGORA))
      .toThrow(ErroProibido);
  });

  test('atividade cancelada ou que já começou não aceita inscrições', () => {
    expect(() => solicitarParticipacao(atividade({ status: 'CANCELADA' }), [], joao, AGORA))
      .toThrow('Atividade não aceita inscrições');
    expect(() => solicitarParticipacao(atividade({ dataHora: new Date('2026-10-01T10:00:00Z') }), [], joao, AGORA))
      .toThrow('Atividade já começou');
  });
});

describe('Domínio — responderSolicitacao (passo 7)', () => {
  test('CT-01: organizador aceita → ACEITO com data de resposta', () => {
    const p = participacao(2, 'PENDENTE');
    const r = responderSolicitacao(atividade(), p, [p], organizador, 'aceitar', AGORA);
    expect(r).toMatchObject({ status: 'ACEITO', respondidaEm: AGORA });
  });

  test('CT-05: organizador recusa → REJEITADO', () => {
    const p = participacao(2, 'PENDENTE');
    expect(responderSolicitacao(atividade(), p, [p], organizador, 'RECUSAR', AGORA).status).toBe('REJEITADO');
  });

  test('somente o organizador pode responder', () => {
    const p = participacao(2, 'PENDENTE');
    expect(() => responderSolicitacao(atividade(), p, [p], maria, 'ACEITAR', AGORA)).toThrow(ErroProibido);
  });

  test('não responde duas vezes nem aceita sem vaga', () => {
    const respondida = participacao(2, 'ACEITO');
    expect(() => responderSolicitacao(atividade(), respondida, [respondida], organizador, 'RECUSAR', AGORA))
      .toThrow('Solicitação já foi respondida');

    const pendente = participacao(4, 'PENDENTE');
    const lotada = [participacao(2, 'ACEITO'), participacao(3, 'ACEITO'), pendente];
    expect(() => responderSolicitacao(atividade(), pendente, lotada, organizador, 'ACEITAR', AGORA))
      .toThrow('Atividade sem vagas');
  });

  test('decisão inválida gera ErroValidacao', () => {
    const p = participacao(2, 'PENDENTE');
    expect(() => responderSolicitacao(atividade(), p, [p], organizador, 'talvez', AGORA)).toThrow(ErroValidacao);
  });
});

describe('Domínio — filtros (Strategy)', () => {
  const lista = [
    atividade({ id: 1, tipo: 'futebol', nivel: 'iniciante', vagas: 3 }),
    atividade({ id: 2, tipo: 'basquete', nivel: 'intermediario', publicoAlvo: 'adultos', vagas: 0 }),
    atividade({ id: 3, tipo: 'basquete', nivel: 'intermediario', publicoAlvo: 'adolescentes', local: 'Quadra Mackenzie', vagas: 5 }),
  ];
  const ids = (q) => aplicarFiltros(lista, lerFiltros(q)).map((a) => a.id);

  test('CT-07: combinação de filtros retorna só o que atende a todos', () => {
    expect(ids({ tipo: 'Basquete', nivel: 'intermediario', publicoAlvo: 'adultos' })).toEqual([2]);
    expect(ids({ tipo: 'basquete', comVaga: 'true' })).toEqual([3]);
  });

  test('CT-03: nenhum resultado para modalidade inexistente; sem filtros retorna tudo', () => {
    expect(ids({ tipo: 'surf' })).toEqual([]);
    expect(ids({})).toEqual([1, 2, 3]);
  });

  test('local faz busca parcial sem acento e data filtra o dia', () => {
    expect(ids({ local: 'mackénzie' })).toEqual([3]);
    expect(ids({ data: '2026-11-20' })).toEqual([1, 2, 3]);
    expect(ids({ data: '2026-11-21' })).toEqual([]);
  });

  test('filtros inválidos geram ErroValidacao', () => {
    expect(() => lerFiltros({ nivel: 'profissional' })).toThrow(ErroValidacao);
    expect(() => lerFiltros({ data: '20/11/2026' })).toThrow(ErroValidacao);
  });
});
