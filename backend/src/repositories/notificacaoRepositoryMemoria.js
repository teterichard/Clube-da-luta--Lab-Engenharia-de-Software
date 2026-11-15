/** Repositório de notificações em memória — testes e execução sem banco. */
function criarNotificacaoRepositoryMemoria() {
  const notificacoes = new Map();
  let proximoId = 1;
  const doUsuario = (usuarioId) => [...notificacoes.values()].filter((n) => String(n.usuarioId) === String(usuarioId));

  return {
    async salvarVarias(lista) {
      return lista.map((n) => {
        const salva = { id: proximoId++, ...n };
        notificacoes.set(salva.id, salva);
        return { ...salva };
      });
    },
    async buscarPorId(id) {
      const n = notificacoes.get(Number(id));
      return n ? { ...n } : null;
    },
    /** Mais recentes primeiro; `limite` evita listas enormes. */
    async listarPorUsuario(usuarioId, { somenteNaoLidas = false, limite = 50 } = {}) {
      return doUsuario(usuarioId)
        .filter((n) => !somenteNaoLidas || !n.lida)
        .sort((a, b) => new Date(b.criadaEm) - new Date(a.criadaEm) || b.id - a.id)
        .slice(0, limite)
        .map((n) => ({ ...n }));
    },
    async contarNaoLidas(usuarioId) {
      return doUsuario(usuarioId).filter((n) => !n.lida).length;
    },
    async marcarLida(id) {
      const n = notificacoes.get(Number(id));
      if (n) n.lida = true;
      return n ? { ...n } : null;
    },
    async marcarTodasLidas(usuarioId) {
      doUsuario(usuarioId).forEach((n) => { n.lida = true; });
    },
  };
}

module.exports = { criarNotificacaoRepositoryMemoria };
