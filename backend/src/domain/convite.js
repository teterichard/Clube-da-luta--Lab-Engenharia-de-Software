const { StatusAtividade, StatusConvite, StatusParticipacao } = require('./enums');
const { ErroProibido, ErroRegraNegocio, ErroValidacao } = require('./erros');
const { ehOrganizador } = require('./atividade');
const { calcularVagas, Decisao } = require('./participacao');

/**
 * UC 5.2 passo 4 — "Convidar pessoas específicas" (RF07).
 * O convite é o caminho para entrar em atividades PRIVADAS (RI04) e também pode ser usado nas públicas.
 * Aceitar um convite confirma a presença direto (participação ACEITO), sem passar pela fila de solicitações.
 */

const mesmoId = (a, b) => a != null && b != null && String(a) === String(b);

function exigirAtividadeAberta(atividade, agora) {
  if (atividade.status !== StatusAtividade.AGENDADA) {
    throw new ErroRegraNegocio('Atividade não está mais aberta');
  }
  if (new Date(atividade.dataHora) <= agora) {
    throw new ErroRegraNegocio('Atividade já começou');
  }
}

/** Convite ativo = ainda pendente ou já aceito (um recusado pode ser refeito). */
function conviteAtivo(convites, usuarioId) {
  return convites.find((c) => mesmoId(c.convidadoId, usuarioId) && c.status !== StatusConvite.RECUSADO);
}

/**
 * RC01 só o organizador convida · RC02 atividade AGENDADA e futura · RC03 não convida a si mesmo
 * RC04 sem convite ativo duplicado · RC05 não convida quem já está confirmado
 */
function criarConvite(atividade, usuario, convidado, convites, participacoes, agora = new Date()) {
  if (!ehOrganizador(atividade, usuario)) {
    throw new ErroProibido('Somente o organizador pode convidar pessoas');
  }
  exigirAtividadeAberta(atividade, agora);
  if (mesmoId(convidado.id, atividade.organizadorId)) {
    throw new ErroRegraNegocio('O organizador já participa da própria atividade');
  }
  if (conviteAtivo(convites, convidado.id)) {
    throw new ErroRegraNegocio('Esta pessoa já foi convidada');
  }
  const confirmado = participacoes.some(
    (p) => mesmoId(p.usuarioId, convidado.id) && p.status === StatusParticipacao.ACEITO,
  );
  if (confirmado) {
    throw new ErroRegraNegocio('Esta pessoa já está confirmada na atividade');
  }

  return {
    atividadeId: atividade.id,
    convidadoId: convidado.id,
    status: StatusConvite.PENDENTE,
    criadoEm: agora,
    respondidoEm: null,
  };
}

/**
 * Convidado aceita ou recusa. RC06 só o convidado responde · RC07 só convites PENDENTES
 * RC08 atividade ainda aberta · RC09 aceitar exige vaga.
 */
function responderConvite(convite, atividade, participacoes, usuario, decisao, agora = new Date()) {
  const d = typeof decisao === 'string' ? decisao.trim().toUpperCase() : '';
  if (!Object.values(Decisao).includes(d)) {
    throw new ErroValidacao([{ campo: 'decisao', mensagem: 'Decisão deve ser ACEITAR ou RECUSAR' }]);
  }
  if (!usuario || !mesmoId(convite.convidadoId, usuario.id)) {
    throw new ErroProibido('Somente o convidado pode responder este convite');
  }
  if (convite.status !== StatusConvite.PENDENTE) {
    throw new ErroRegraNegocio('Convite já foi respondido');
  }
  if (d === Decisao.ACEITAR) {
    exigirAtividadeAberta(atividade, agora);
    if (calcularVagas(atividade, participacoes) === 0) {
      throw new ErroRegraNegocio('Atividade sem vagas');
    }
  }

  return {
    ...convite,
    status: d === Decisao.ACEITAR ? StatusConvite.ACEITO : StatusConvite.RECUSADO,
    respondidoEm: agora,
  };
}

/** Quem tem convite (pendente ou aceito) pode ver uma atividade privada. */
function podeVerPorConvite(convites, usuario) {
  return !!usuario && !!conviteAtivo(convites, usuario.id);
}

module.exports = { criarConvite, responderConvite, podeVerPorConvite };
