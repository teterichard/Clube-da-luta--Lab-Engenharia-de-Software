const { PublicoAlvo } = require('./enums');
const { ErroProibido, ErroRegraNegocio } = require('./erros');

/**
 * RF19 / RNF08 — faixa etária. Público "adultos" só aceita 18+ e "menores" só aceita menores de 18.
 * Qualquer outro público ("todos"...) é livre. Vale para atividades e comunidades.
 * A idade vem do perfil (campo opcional): sem ela, não dá para entrar onde há restrição.
 */
const IDADE_ADULTA = 18;

const normalizar = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : '');

/** true quando a idade combina com o público (idade desconhecida não esconde nada na busca). */
function idadePermite(publicoAlvo, idade) {
  const publico = normalizar(publicoAlvo);
  if (idade == null) return true;
  if (publico === PublicoAlvo.ADULTOS) return idade >= IDADE_ADULTA;
  if (publico === PublicoAlvo.MENORES) return idade < IDADE_ADULTA;
  return true;
}

function temRestricao(publicoAlvo) {
  return [PublicoAlvo.ADULTOS, PublicoAlvo.MENORES].includes(normalizar(publicoAlvo));
}

/**
 * Lança erro se a pessoa não pode entrar. `oQue` só muda o texto ("atividade" ou "comunidade").
 * - sem idade no perfil → 409 pedindo para informar
 * - fora da faixa → 403
 */
function verificarFaixaEtaria(publicoAlvo, usuario, oQue = 'atividade') {
  if (!temRestricao(publicoAlvo)) return;
  const paraQuem = normalizar(publicoAlvo) === PublicoAlvo.ADULTOS ? 'maiores de 18 anos' : 'menores de 18 anos';
  if (usuario.idade == null) {
    throw new ErroRegraNegocio(`Esta ${oQue} é só para ${paraQuem}. Informe sua idade no perfil para participar`);
  }
  if (!idadePermite(publicoAlvo, usuario.idade)) {
    throw new ErroProibido(`Esta ${oQue} é só para ${paraQuem}`);
  }
}

module.exports = {
  IDADE_ADULTA, idadePermite, temRestricao, verificarFaixaEtaria,
};
