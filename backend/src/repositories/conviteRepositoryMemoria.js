/** Repositório de convites em memória — testes e execução sem banco. */
function criarConviteRepositoryMemoria() {
  const convites = new Map();
  let proximoId = 1;
  const copia = (c) => ({ ...c });

  return {
    async salvar(convite) {
      const salvo = { id: proximoId++, ...convite };
      convites.set(salvo.id, salvo);
      return copia(salvo);
    },
    async atualizar(convite) {
      convites.set(convite.id, copia(convite));
      return copia(convite);
    },
    async buscarPorId(id) {
      const c = convites.get(Number(id));
      return c ? copia(c) : null;
    },
    async listarPorAtividade(atividadeId) {
      return [...convites.values()].filter((c) => String(c.atividadeId) === String(atividadeId)).map(copia);
    },
    async listarPorConvidado(usuarioId) {
      return [...convites.values()]
        .filter((c) => String(c.convidadoId) === String(usuarioId))
        .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
        .map(copia);
    },
    async removerPorAtividade(atividadeId) {
      [...convites.values()]
        .filter((c) => String(c.atividadeId) === String(atividadeId))
        .forEach((c) => convites.delete(c.id));
    },
  };
}

module.exports = { criarConviteRepositoryMemoria };
