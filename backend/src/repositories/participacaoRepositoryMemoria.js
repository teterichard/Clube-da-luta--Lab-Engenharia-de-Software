const { StatusParticipacao } = require('../domain/enums');

/** Repositório de participações em memória — testes e execução sem banco. */
function criarParticipacaoRepositoryMemoria() {
  const participacoes = new Map();
  let proximoId = 1;

  return {
    async salvar(participacao) {
      const salva = { id: proximoId++, ...participacao };
      participacoes.set(salva.id, salva);
      return { ...salva };
    },
    async atualizar(participacao) {
      participacoes.set(participacao.id, { ...participacao });
      return { ...participacao };
    },
    async buscarPorId(id) {
      const p = participacoes.get(Number(id));
      return p ? { ...p } : null;
    },
    async listarPorAtividade(atividadeId) {
      return [...participacoes.values()]
        .filter((p) => String(p.atividadeId) === String(atividadeId))
        .map((p) => ({ ...p }));
    },
    /** Map atividadeId → quantidade de participações ACEITAS (para calcular vagas na listagem). */
    async contarAceitas(atividadeIds) {
      const contagem = new Map(atividadeIds.map((id) => [id, 0]));
      participacoes.forEach((p) => {
        if (p.status === StatusParticipacao.ACEITO && contagem.has(p.atividadeId)) {
          contagem.set(p.atividadeId, contagem.get(p.atividadeId) + 1);
        }
      });
      return contagem;
    },
  };
}

module.exports = { criarParticipacaoRepositoryMemoria };
