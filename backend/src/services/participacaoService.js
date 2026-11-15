const {
  solicitarParticipacao,
  responderSolicitacao,
  cancelarParticipacao,
  ehOrganizador,
} = require('../domain/participacao');
const { ErroNaoEncontrado, ErroProibido } = require('../domain/erros');

/**
 * Caso de uso principal — "Inscrever-se em atividade" (passos 6 e 7, fluxos alternativos 2 e 3).
 * Orquestra domínio + repositórios; as regras ficam em domain/participacao.js.
 */
function criarParticipacaoService({
  atividadeRepository,
  participacaoRepository,
  usuarioRepository,
  relogio = () => new Date(),
}) {
  async function carregarAtividade(id) {
    const atividade = await atividadeRepository.buscarPorId(id);
    if (!atividade) throw new ErroNaoEncontrado('Atividade não encontrada');
    return atividade;
  }

  async function carregarParticipacao(id) {
    const participacao = await participacaoRepository.buscarPorId(id);
    if (!participacao) throw new ErroNaoEncontrado('Solicitação não encontrada');
    return participacao;
  }

  /** Acrescenta { usuario: { id, nome } } para o organizador saber quem pediu. */
  async function comNomes(participacoes) {
    if (!usuarioRepository) return participacoes;
    const resumos = await usuarioRepository.buscarResumos([...new Set(participacoes.map((p) => p.usuarioId))]);
    return participacoes.map((p) => ({ ...p, usuario: resumos.get(Number(p.usuarioId)) || null }));
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
      return comNomes(await participacaoRepository.listarPorAtividade(atividade.id));
    },

    /** "Suas inscrições": participações do usuário logado com um resumo de cada atividade. */
    async listarMinhas(usuario) {
      const participacoes = await participacaoRepository.listarPorUsuario(usuario.id);
      const atividades = await Promise.all(participacoes.map((p) => atividadeRepository.buscarPorId(p.atividadeId)));
      return participacoes
        .map((p, i) => {
          const a = atividades[i];
          if (!a) return null;
          return {
            ...p,
            atividade: {
              id: a.id,
              titulo: a.titulo,
              descricao: a.descricao,
              tipo: a.tipo,
              nivel: a.nivel,
              dataHora: a.dataHora,
              local: a.local,
              status: a.status,
              visibilidade: a.visibilidade,
            },
          };
        })
        .filter(Boolean);
    },

    /** P6 — participante desiste da solicitação ou da vaga confirmada. */
    async cancelar(participacaoId, usuario) {
      const participacao = await carregarParticipacao(participacaoId);
      const atividade = await carregarAtividade(participacao.atividadeId);
      const cancelada = cancelarParticipacao(atividade, participacao, usuario, relogio());
      return participacaoRepository.atualizar(cancelada);
    },

    /** Passo 7 — organizador aceita (CT-01) ou recusa (CT-05). */
    async responder(participacaoId, usuario, decisao) {
      const participacao = await carregarParticipacao(participacaoId);
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
