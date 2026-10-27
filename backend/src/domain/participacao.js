const { StatusAtividade, Visibilidade, StatusParticipacao } = require('./enums');
const { ErroRegraNegocio, ErroProibido, ErroValidacao } = require('./erros');

/**
 * Regras do caso de uso principal "Inscrever-se em atividade" (wiki — plano de testes CT-01 a CT-06).
 * Portadas da classe Java Atividade/Participacao (solicitarParticipacao, getVagas, confirmar, rejeitar).
 * Funções puras: não dependem de Express nem de banco.
 */

const mesmoId = (a, b) => a != null && b != null && String(a) === String(b);

/** Vagas restantes = número de integrantes − participações ACEITAS. */
function calcularVagas(atividade, participacoes) {
  const aceitas = participacoes.filter((p) => p.status === StatusParticipacao.ACEITO).length;
  return Math.max(atividade.numeroIntegrantes - aceitas, 0);
}

function ehOrganizador(atividade, usuario) {
  return !!usuario && mesmoId(atividade.organizadorId, usuario.id);
}

/**
 * Passo 6 do fluxo básico — usuário solicita participação.
 * RI01 atividade AGENDADA · RI02 atividade ainda não começou · RI03 organizador não se inscreve
 * RI04 privada só por convite · RI05 precisa haver vaga (CT-04) · RI06 sem duplicidade (CT-06)
 */
function solicitarParticipacao(atividade, participacoes, usuario, agora = new Date()) {
  if (atividade.status !== StatusAtividade.AGENDADA) {
    throw new ErroRegraNegocio('Atividade não aceita inscrições');
  }
  if (new Date(atividade.dataHora) <= agora) {
    throw new ErroRegraNegocio('Atividade já começou');
  }
  if (ehOrganizador(atividade, usuario)) {
    throw new ErroRegraNegocio('Organizador não pode se inscrever na própria atividade');
  }
  if (atividade.visibilidade === Visibilidade.PRIVADA) {
    throw new ErroProibido('Atividade privada: participação somente por convite');
  }
  if (calcularVagas(atividade, participacoes) === 0) {
    throw new ErroRegraNegocio('Atividade sem vagas');
  }
  const jaSolicitou = participacoes.some(
    (p) => mesmoId(p.usuarioId, usuario.id) && p.status !== StatusParticipacao.REJEITADO,
  );
  if (jaSolicitou) {
    throw new ErroRegraNegocio('Solicitação já enviada');
  }

  return {
    atividadeId: atividade.id,
    usuarioId: usuario.id,
    status: StatusParticipacao.PENDENTE,
    solicitadaEm: agora,
    respondidaEm: null,
  };
}

const Decisao = Object.freeze({ ACEITAR: 'ACEITAR', RECUSAR: 'RECUSAR' });

/**
 * Passo 7 do fluxo básico (CT-01) e fluxo alternativo 3 (CT-05) — organizador aceita ou recusa.
 * Aceitar desconta vaga; recusar não. Só solicitações PENDENTES podem ser respondidas.
 */
function responderSolicitacao(atividade, participacao, participacoes, usuario, decisao, agora = new Date()) {
  const d = typeof decisao === 'string' ? decisao.trim().toUpperCase() : '';
  if (!Object.values(Decisao).includes(d)) {
    throw new ErroValidacao([{ campo: 'decisao', mensagem: 'Decisão deve ser ACEITAR ou RECUSAR' }]);
  }
  if (!ehOrganizador(atividade, usuario)) {
    throw new ErroProibido('Somente o organizador pode responder solicitações');
  }
  if (participacao.status !== StatusParticipacao.PENDENTE) {
    throw new ErroRegraNegocio('Solicitação já foi respondida');
  }
  if (d === Decisao.ACEITAR && calcularVagas(atividade, participacoes) === 0) {
    throw new ErroRegraNegocio('Atividade sem vagas');
  }

  return {
    ...participacao,
    status: d === Decisao.ACEITAR ? StatusParticipacao.ACEITO : StatusParticipacao.REJEITADO,
    respondidaEm: agora,
  };
}

module.exports = {
  calcularVagas,
  ehOrganizador,
  solicitarParticipacao,
  responderSolicitacao,
  Decisao,
};
