const { TipoAvaliacao } = require('./enums');
const { ErroValidacao, ErroRegraNegocio } = require('./erros');

/**
 * RF12–RF14 (avaliar a atividade e os participantes depois da conclusão) e
 * RF18 (avaliar a comunidade depois de 3 meses). Quem pode avaliar o quê é decidido no serviço;
 * aqui ficam a nota, o comentário, a duplicidade e a média.
 */
const MESES_PARA_AVALIAR_COMUNIDADE = 3;

const texto = (v) => (typeof v === 'string' ? v.trim() : '');

/** Nota inteira de 1 a 5 e comentário opcional de até 500 caracteres. Uma avaliação por autor e alvo. */
function criarAvaliacao({
  autorId, tipo, alvoId, contextoId = 0, dados, jaAvaliou, agora = new Date(),
}) {
  const d = dados || {};
  const erros = [];
  if (!Number.isInteger(d.nota) || d.nota < 1 || d.nota > 5) {
    erros.push({ campo: 'nota', mensagem: 'Nota deve ser um número inteiro de 1 a 5' });
  }
  const comentario = texto(d.comentario);
  if (comentario.length > 500) {
    erros.push({ campo: 'comentario', mensagem: 'Comentário deve ter no máximo 500 caracteres' });
  }
  if (erros.length > 0) throw new ErroValidacao(erros);
  if (jaAvaliou) throw new ErroRegraNegocio('Você já fez essa avaliação');

  return {
    autorId, tipo, alvoId, contextoId, nota: d.nota, comentario: comentario || null, criadaEm: agora,
  };
}

/** Média com uma casa decimal (null quando ainda não há avaliações). */
function resumir(avaliacoes) {
  if (avaliacoes.length === 0) return { media: null, total: 0 };
  const soma = avaliacoes.reduce((s, a) => s + a.nota, 0);
  return { media: Math.round((soma / avaliacoes.length) * 10) / 10, total: avaliacoes.length };
}

/** Data a partir da qual um membro pode avaliar a comunidade (entrada + 3 meses). */
function podeAvaliarComunidadeEm(entrouEm) {
  const d = new Date(entrouEm);
  d.setUTCMonth(d.getUTCMonth() + MESES_PARA_AVALIAR_COMUNIDADE);
  return d;
}

module.exports = {
  TipoAvaliacao,
  MESES_PARA_AVALIAR_COMUNIDADE,
  criarAvaliacao,
  resumir,
  podeAvaliarComunidadeEm,
};
