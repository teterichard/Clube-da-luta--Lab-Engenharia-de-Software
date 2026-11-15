/** Repositório de comunidades e membros em memória — testes e execução sem banco. */
function criarComunidadeRepositoryMemoria() {
  const comunidades = new Map();
  let membros = [];
  let proximoId = 1;
  const chave = (comunidadeId, usuarioId) => `${comunidadeId}:${usuarioId}`;
  const igual = (a, b) => String(a) === String(b);

  return {
    async salvar(comunidade) {
      const salva = { id: proximoId++, ...comunidade };
      comunidades.set(salva.id, salva);
      return { ...salva };
    },
    async atualizar(comunidade) {
      comunidades.set(comunidade.id, { ...comunidade });
      return { ...comunidade };
    },
    async buscarPorId(id) {
      const c = comunidades.get(Number(id));
      return c ? { ...c } : null;
    },
    /** Busca opcional por nome ou descrição (sem diferenciar maiúsculas). */
    async listar({ busca } = {}) {
      const termo = (busca || '').toLowerCase();
      return [...comunidades.values()]
        .filter((c) => !termo || c.nome.toLowerCase().includes(termo) || c.descricao.toLowerCase().includes(termo))
        .sort((a, b) => a.nome.localeCompare(b.nome))
        .map((c) => ({ ...c }));
    },

    async adicionarMembro(membro) {
      membros.push({ ...membro });
      return { ...membro };
    },
    async atualizarMembro(membro) {
      membros = membros.map((m) => (chave(m.comunidadeId, m.usuarioId) === chave(membro.comunidadeId, membro.usuarioId)
        ? { ...membro } : m));
      return { ...membro };
    },
    async removerMembro(comunidadeId, usuarioId) {
      membros = membros.filter((m) => !(igual(m.comunidadeId, comunidadeId) && igual(m.usuarioId, usuarioId)));
    },
    /** Administradores primeiro, depois por ordem de entrada. */
    async listarMembros(comunidadeId) {
      return membros
        .filter((m) => igual(m.comunidadeId, comunidadeId))
        .sort((a, b) => (b.papel === 'ADMIN') - (a.papel === 'ADMIN')
          || new Date(a.entrouEm) - new Date(b.entrouEm)
          || a.usuarioId - b.usuarioId)
        .map((m) => ({ ...m }));
    },
    async listarVinculosDoUsuario(usuarioId) {
      return membros.filter((m) => igual(m.usuarioId, usuarioId)).map((m) => ({ ...m }));
    },
    /** Map comunidadeId → quantidade de membros ATIVOS. */
    async contarMembrosAtivos(ids) {
      const contagem = new Map(ids.map((id) => [Number(id), 0]));
      membros.forEach((m) => {
        if (m.status === 'ATIVO' && contagem.has(Number(m.comunidadeId))) {
          contagem.set(Number(m.comunidadeId), contagem.get(Number(m.comunidadeId)) + 1);
        }
      });
      return contagem;
    },
  };
}

module.exports = { criarComunidadeRepositoryMemoria };
