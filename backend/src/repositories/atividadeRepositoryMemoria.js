const { StatusAtividade, Visibilidade } = require('../domain/enums');

/** Repositório em memória — usado nos testes e para rodar sem banco. */
function criarAtividadeRepositoryMemoria() {
  const atividades = new Map();
  let proximoId = 1;

  return {
    async salvar(atividade) {
      const salva = { id: proximoId++, ...atividade };
      atividades.set(salva.id, salva);
      return salva;
    },
    async buscarPorId(id) {
      return atividades.get(Number(id)) || null;
    },
    /** Atividades que aparecem na busca: públicas, agendadas e futuras, ordenadas por data. */
    async listarAbertas(agora) {
      return [...atividades.values()]
        .filter((a) => a.visibilidade === Visibilidade.PUBLICA
          && a.status === StatusAtividade.AGENDADA
          && new Date(a.dataHora) > agora)
        .sort((a, b) => new Date(a.dataHora) - new Date(b.dataHora));
    },
  };
}

module.exports = { criarAtividadeRepositoryMemoria };
