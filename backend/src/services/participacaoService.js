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
  comTrava,
  relogio = () => new Date(),
}) {
  async function carregarAtividade(id, repo = atividadeRepository) {
    const atividade = await repo.buscarPorId(id);
    if (!atividade) throw new ErroNaoEncontrado('Atividade não encontrada');
    return atividade;
  }

  async function carregarParticipacao(id, repo = participacaoRepository) {
    const participacao = await repo.buscarPorId(id);
    if (!participacao) throw new ErroNaoEncontrado('Solicitação não encontrada');
    return participacao;
  }

  /**
   * Tudo que lê as vagas e depois grava roda com a atividade travada: a leitura e a
   * escrita viram uma operação só, e aceites simultâneos não estouram o limite.
   */
  async function naAtividade(atividadeId, fn) {
    await carregarAtividade(atividadeId); // 404 antes de abrir a trava
    return comTrava(atividadeId, async (repos) => {
      const atividade = await carregarAtividade(atividadeId, repos.atividadeRepository);
      return fn(atividade, repos);
    });
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
      return naAtividade(atividadeId, async (atividade, repos) => {
        const participacoes = await repos.participacaoRepository.listarPorAtividade(atividade.id);
        const nova = solicitarParticipacao(atividade, participacoes, usuario, relogio());
        return repos.participacaoRepository.salvar(nova);
      });
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
      const { atividadeId } = await carregarParticipacao(participacaoId);
      return naAtividade(atividadeId, async (atividade, repos) => {
        const participacao = await carregarParticipacao(participacaoId, repos.participacaoRepository);
        const cancelada = cancelarParticipacao(atividade, participacao, usuario, relogio());
        return repos.participacaoRepository.atualizar(cancelada);
      });
    },

    /** Passo 7 — organizador aceita (CT-01) ou recusa (CT-05). */
    async responder(participacaoId, usuario, decisao) {
      const { atividadeId } = await carregarParticipacao(participacaoId);
      return naAtividade(atividadeId, async (atividade, repos) => {
        // relê dentro da trava: outra requisição pode ter respondido ou ocupado a vaga
        const participacao = await carregarParticipacao(participacaoId, repos.participacaoRepository);
        const participacoes = await repos.participacaoRepository.listarPorAtividade(atividade.id);
        const respondida = responderSolicitacao(
          atividade, participacao, participacoes, usuario, decisao, relogio(),
        );
        return repos.participacaoRepository.atualizar(respondida);
      });
    },
  };
}

module.exports = { criarParticipacaoService };
