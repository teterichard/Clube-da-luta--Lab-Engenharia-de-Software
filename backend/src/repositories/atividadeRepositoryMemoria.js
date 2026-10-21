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
  };
}

module.exports = { criarAtividadeRepositoryMemoria };
