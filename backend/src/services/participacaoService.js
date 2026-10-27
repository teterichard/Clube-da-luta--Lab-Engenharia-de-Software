const {
  solicitarParticipacao,
  responderSolicitacao,
  ehOrganizador,
} = require('../domain/participacao');
const { ErroNaoEncontrado, ErroProibido } = require('../domain/erros');

/**
 * Caso de uso principal — "Inscrever-se em atividade" (passos 6 e 7, fluxos alternativos 2 e 3).
 * Orquestra domínio + repositórios; as regras ficam em domain/participacao.js.
 */
function criarParticipacaoService({ atividadeRepository, participacaoRepository, relogio = () => new Date() }) {
  async function carregarAtividade(id) {
    const atividade = await atividadeRepository.buscarPorId(id);
    if (!atividade) throw new ErroNaoEncontrado('Atividade não encontrada');
    return atividade;
  }

  return {
    /** Passo 6 — participante clica em "Solicitar participação" (CT-01, CT-04, CT-06). */
    async solicitar(atividadeId, usuario) {
      const atividade = await carregarAtividade(atividadeId);
      const participacoes = await participacaoRepository.listarPorAtividade(atividade.id);
      const nova = solicitarParticipacao(atividade, participacoes, usuario, relogio());
      return participacaoRepository.salvar(nova);
    },

    /** Organizador vê as solicitações da sua atividade. */
    async listarDaAtividade(atividadeId, usuario) {
      const atividade = await carregarAtividade(atividadeId);
      if (!ehOrganizador(atividade, usuario)) {
        throw new ErroProibido('Somente o organizador pode ver as solicitações');
      }
      return participacaoRepository.listarPorAtividade(atividade.id);
    },

    /** Passo 7 — organizador aceita (CT-01) ou recusa (CT-05). */
    async responder(participacaoId, usuario, decisao) {
      const participacao = await participacaoRepository.buscarPorId(participacaoId);
      if (!participacao) throw new ErroNaoEncontrado('Solicitação não encontrada');
      const atividade = await carregarAtividade(participacao.atividadeId);
      const participacoes = await participacaoRepository.listarPorAtividade(atividade.id);
      const respondida = responderSolicitacao(
        atividade, participacao, participacoes, usuario, decisao, relogio(),
      );
      return participacaoRepository.atualizar(respondida);
    },
  };
}

module.exports = { criarParticipacaoService };
