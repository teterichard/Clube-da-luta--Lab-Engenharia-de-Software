const { traduzirEvento, usuariosDoEvento, verificarDono } = require('../src/domain/notificacao');
const { Eventos } = require('../src/domain/eventos');
const { ErroNaoEncontrado } = require('../src/domain/erros');

const nomes = { 1: 'Org', 2: 'Ana', 3: 'Bia' };
const nome = (id) => nomes[id];
const atividade = { id: 10, titulo: 'Yoga no parque', organizadorId: 1 };

describe('Notificações — tradução de eventos', () => {
  test('solicitação avisa o organizador com o nome de quem pediu', () => {
    expect(traduzirEvento(Eventos.PARTICIPACAO_SOLICITADA, { atividade, participacao: { usuarioId: 2 } }, nome))
      .toEqual([{ usuarioId: 1, tipo: 'SOLICITACAO_RECEBIDA', atividadeId: 10, mensagem: 'Ana pediu para participar de "Yoga no parque"' }]);
  });

  test('CT-05: resposta avisa o participante (aceita ou recusada)', () => {
    const [aceita] = traduzirEvento(Eventos.PARTICIPACAO_RESPONDIDA, { atividade, participacao: { usuarioId: 2, status: 'ACEITO' } }, nome);
    const [recusada] = traduzirEvento(Eventos.PARTICIPACAO_RESPONDIDA, { atividade, participacao: { usuarioId: 2, status: 'REJEITADO' } }, nome);
    expect(aceita).toMatchObject({ usuarioId: 2, tipo: 'SOLICITACAO_ACEITA' });
    expect(recusada).toMatchObject({ usuarioId: 2, tipo: 'SOLICITACAO_RECUSADA' });
  });

  test('convite avisa o convidado e a resposta avisa o organizador', () => {
    expect(traduzirEvento(Eventos.CONVITE_CRIADO, { atividade, convite: { convidadoId: 3 } }, nome)[0])
      .toMatchObject({ usuarioId: 3, tipo: 'CONVITE_RECEBIDO', mensagem: 'Org convidou você para "Yoga no parque"' });
    expect(traduzirEvento(Eventos.CONVITE_RESPONDIDO, { atividade, convite: { convidadoId: 3, status: 'RECUSADO' } }, nome)[0])
      .toMatchObject({ usuarioId: 1, tipo: 'CONVITE_RECUSADO', mensagem: 'Bia recusou o convite para "Yoga no parque"' });
  });

  test('cancelamento e edição avisam só quem está pendente ou aceito', () => {
    const participacoes = [
      { usuarioId: 2, status: 'ACEITO' },
      { usuarioId: 3, status: 'PENDENTE' },
      { usuarioId: 4, status: 'REJEITADO' },
      { usuarioId: 5, status: 'CANCELADO' },
    ];
    expect(traduzirEvento(Eventos.ATIVIDADE_CANCELADA, { atividade, participacoes }, nome).map((n) => n.usuarioId))
      .toEqual([2, 3]);
    const [editada] = traduzirEvento(Eventos.ATIVIDADE_EDITADA, { atividade, participacoes, campos: ['dataHora', 'local'] }, nome);
    expect(editada.mensagem).toBe('"Yoga no parque" mudou (data/horário, local). Confira os detalhes');
  });

  test('evento desconhecido não gera aviso; usuariosDoEvento junta os ids citados', () => {
    expect(traduzirEvento('outro', {}, nome)).toEqual([]);
    expect(usuariosDoEvento({ atividade, participacao: { usuarioId: 2 } })).toEqual([1, 2]);
  });

  test('verificarDono: notificação de outra pessoa é tratada como inexistente', () => {
    expect(() => verificarDono({ usuarioId: 2 }, { id: 2 })).not.toThrow();
    expect(() => verificarDono({ usuarioId: 2 }, { id: 3 })).toThrow(ErroNaoEncontrado);
    expect(() => verificarDono(null, { id: 3 })).toThrow(ErroNaoEncontrado);
  });
});
