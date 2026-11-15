const { Eventos } = require('./eventos');
const { StatusParticipacao, StatusConvite } = require('./enums');
const { ErroNaoEncontrado } = require('./erros');

/**
 * Notificações dentro da plataforma (critério de qualidade "confiabilidade das notificações" da wiki).
 * Cada função abaixo traduz um evento de domínio em avisos para as pessoas certas.
 * `nome(id)` devolve o nome de um usuário para montar a mensagem.
 */

const TipoNotificacao = Object.freeze({
  SOLICITACAO_RECEBIDA: 'SOLICITACAO_RECEBIDA',
  SOLICITACAO_ACEITA: 'SOLICITACAO_ACEITA',
  SOLICITACAO_RECUSADA: 'SOLICITACAO_RECUSADA',
  INSCRICAO_CANCELADA: 'INSCRICAO_CANCELADA',
  CONVITE_RECEBIDO: 'CONVITE_RECEBIDO',
  CONVITE_ACEITO: 'CONVITE_ACEITO',
  CONVITE_RECUSADO: 'CONVITE_RECUSADO',
  ATIVIDADE_ALTERADA: 'ATIVIDADE_ALTERADA',
  ATIVIDADE_CANCELADA: 'ATIVIDADE_CANCELADA',
});

const ativa = (p) => p.status === StatusParticipacao.PENDENTE || p.status === StatusParticipacao.ACEITO;
const NOMES_CAMPOS = { dataHora: 'data/horário', local: 'local', titulo: 'título' };

const aviso = (usuarioId, tipo, atividade, mensagem) => ({
  usuarioId, tipo, atividadeId: atividade.id, mensagem,
});

/** Evento → lista de { usuarioId, tipo, atividadeId, mensagem }. */
const TRADUTORES = {
  [Eventos.PARTICIPACAO_SOLICITADA]: ({ atividade, participacao }, nome) => [
    aviso(atividade.organizadorId, TipoNotificacao.SOLICITACAO_RECEBIDA, atividade,
      `${nome(participacao.usuarioId)} pediu para participar de "${atividade.titulo}"`),
  ],

  [Eventos.PARTICIPACAO_RESPONDIDA]: ({ atividade, participacao }) => {
    const aceita = participacao.status === StatusParticipacao.ACEITO;
    return [aviso(
      participacao.usuarioId,
      aceita ? TipoNotificacao.SOLICITACAO_ACEITA : TipoNotificacao.SOLICITACAO_RECUSADA,
      atividade,
      aceita
        ? `Sua participação em "${atividade.titulo}" foi confirmada!`
        : `Sua solicitação para "${atividade.titulo}" não foi aceita desta vez`,
    )];
  },

  [Eventos.PARTICIPACAO_CANCELADA]: ({ atividade, participacao }, nome) => [
    aviso(atividade.organizadorId, TipoNotificacao.INSCRICAO_CANCELADA, atividade,
      `${nome(participacao.usuarioId)} cancelou a inscrição em "${atividade.titulo}"`),
  ],

  [Eventos.CONVITE_CRIADO]: ({ atividade, convite }, nome) => [
    aviso(convite.convidadoId, TipoNotificacao.CONVITE_RECEBIDO, atividade,
      `${nome(atividade.organizadorId)} convidou você para "${atividade.titulo}"`),
  ],

  [Eventos.CONVITE_RESPONDIDO]: ({ atividade, convite }, nome) => {
    const aceito = convite.status === StatusConvite.ACEITO;
    return [aviso(
      atividade.organizadorId,
      aceito ? TipoNotificacao.CONVITE_ACEITO : TipoNotificacao.CONVITE_RECUSADO,
      atividade,
      `${nome(convite.convidadoId)} ${aceito ? 'aceitou' : 'recusou'} o convite para "${atividade.titulo}"`,
    )];
  },

  [Eventos.ATIVIDADE_EDITADA]: ({ atividade, campos, participacoes }) => {
    const descricao = campos.map((c) => NOMES_CAMPOS[c] || c).join(', ');
    return participacoes.filter(ativa).map((p) => aviso(p.usuarioId, TipoNotificacao.ATIVIDADE_ALTERADA, atividade,
      `"${atividade.titulo}" mudou (${descricao}). Confira os detalhes`));
  },

  [Eventos.ATIVIDADE_CANCELADA]: ({ atividade, participacoes }) => participacoes.filter(ativa)
    .map((p) => aviso(p.usuarioId, TipoNotificacao.ATIVIDADE_CANCELADA, atividade,
      `"${atividade.titulo}" foi cancelada pelo organizador`)),
};

/** IDs de usuários citados no evento (para buscar os nomes de uma vez só). */
function usuariosDoEvento(dados) {
  const ids = [dados.atividade?.organizadorId, dados.participacao?.usuarioId, dados.convite?.convidadoId];
  return ids.filter((id) => id != null);
}

function traduzirEvento(tipo, dados, nome) {
  const tradutor = TRADUTORES[tipo];
  return tradutor ? tradutor(dados, nome) : [];
}

function verificarDono(notificacao, usuario) {
  // notificação de outra pessoa se comporta como inexistente (não revela que existe)
  if (!notificacao || String(notificacao.usuarioId) !== String(usuario.id)) {
    throw new ErroNaoEncontrado('Notificação não encontrada');
  }
}

module.exports = {
  TipoNotificacao,
  TRADUTORES,
  traduzirEvento,
  usuariosDoEvento,
  verificarDono,
};
