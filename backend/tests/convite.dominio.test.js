const { criarConvite, responderConvite, podeVerPorConvite } = require('../src/domain/convite');
const { ErroProibido, ErroRegraNegocio, ErroValidacao } = require('../src/domain/erros');

const AGORA = new Date('2026-11-10T12:00:00-03:00');
const ORG = { id: 1 };
const ANA = { id: 2 };
const BIA = { id: 3 };

const atividade = (extra = {}) => ({
  id: 10,
  organizadorId: 1,
  status: 'AGENDADA',
  visibilidade: 'PRIVADA',
  dataHora: '2026-11-20T18:00:00-03:00',
  numeroIntegrantes: 2,
  ...extra,
});
const convite = (extra = {}) => ({ id: 5, atividadeId: 10, convidadoId: 2, status: 'PENDENTE', ...extra });
const aceito = (usuarioId) => ({ usuarioId, status: 'ACEITO' });

describe('Convites — criar (RF07)', () => {
  test('organizador convida e o convite nasce PENDENTE', () => {
    expect(criarConvite(atividade(), ORG, ANA, [], [], AGORA)).toEqual({
      atividadeId: 10, convidadoId: 2, status: 'PENDENTE', criadoEm: AGORA, respondidoEm: null,
    });
  });

  test('RC01: só o organizador convida', () => {
    expect(() => criarConvite(atividade(), ANA, BIA, [], [], AGORA)).toThrow(ErroProibido);
  });

  test('RC02: atividade precisa estar agendada e no futuro', () => {
    expect(() => criarConvite(atividade({ status: 'CANCELADA' }), ORG, ANA, [], [], AGORA)).toThrow(ErroRegraNegocio);
    expect(() => criarConvite(atividade({ dataHora: '2026-11-01T10:00:00-03:00' }), ORG, ANA, [], [], AGORA))
      .toThrow('Atividade já começou');
  });

  test('RC03 a RC05: a si mesmo, duplicado e já confirmado', () => {
    expect(() => criarConvite(atividade(), ORG, ORG, [], [], AGORA)).toThrow(ErroRegraNegocio);
    expect(() => criarConvite(atividade(), ORG, ANA, [convite()], [], AGORA)).toThrow('Esta pessoa já foi convidada');
    expect(() => criarConvite(atividade(), ORG, ANA, [], [aceito(2)], AGORA)).toThrow('já está confirmada');
  });

  test('quem recusou pode ser convidado de novo', () => {
    expect(() => criarConvite(atividade(), ORG, ANA, [convite({ status: 'RECUSADO' })], [], AGORA)).not.toThrow();
  });
});

describe('Convites — responder', () => {
  test('convidado aceita ou recusa', () => {
    expect(responderConvite(convite(), atividade(), [], ANA, 'aceitar', AGORA)).toMatchObject({ status: 'ACEITO', respondidoEm: AGORA });
    expect(responderConvite(convite(), atividade(), [], ANA, 'RECUSAR', AGORA).status).toBe('RECUSADO');
  });

  test('decisão inválida é 400 e outra pessoa é 403', () => {
    expect(() => responderConvite(convite(), atividade(), [], ANA, 'talvez', AGORA)).toThrow(ErroValidacao);
    expect(() => responderConvite(convite(), atividade(), [], BIA, 'ACEITAR', AGORA)).toThrow(ErroProibido);
  });

  test('não responde duas vezes', () => {
    expect(() => responderConvite(convite({ status: 'ACEITO' }), atividade(), [], ANA, 'RECUSAR', AGORA))
      .toThrow('Convite já foi respondido');
  });

  test('aceitar exige vaga e atividade aberta; recusar não', () => {
    const lotada = [aceito(7), aceito(8)];
    expect(() => responderConvite(convite(), atividade(), lotada, ANA, 'ACEITAR', AGORA)).toThrow('Atividade sem vagas');
    expect(responderConvite(convite(), atividade(), lotada, ANA, 'RECUSAR', AGORA).status).toBe('RECUSADO');
    expect(() => responderConvite(convite(), atividade({ status: 'CANCELADA' }), [], ANA, 'ACEITAR', AGORA))
      .toThrow(ErroRegraNegocio);
  });

  test('podeVerPorConvite: só com convite pendente ou aceito', () => {
    expect(podeVerPorConvite([convite()], ANA)).toBe(true);
    expect(podeVerPorConvite([convite({ status: 'RECUSADO' })], ANA)).toBe(false);
    expect(podeVerPorConvite([convite()], BIA)).toBe(false);
  });
});
