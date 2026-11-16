/** Repositório de usuários em memória — testes e execução sem banco. */
function criarUsuarioRepositoryMemoria() {
  const usuarios = new Map();
  let proximoId = 1;

  return {
    async salvar(usuario) {
      const salvo = { id: proximoId++, ...usuario };
      usuarios.set(salvo.id, salvo);
      return { ...salvo };
    },
    async atualizar(id, alteracoes) {
      const atual = usuarios.get(Number(id));
      if (!atual) return null;
      const atualizado = { ...atual, ...alteracoes };
      usuarios.set(atual.id, atualizado);
      return { ...atualizado };
    },
    async buscarPorId(id) {
      const u = usuarios.get(Number(id));
      return u ? { ...u } : null;
    },
    async buscarPorEmail(email) {
      const u = [...usuarios.values()].find((x) => x.email === email);
      return u ? { ...u } : null;
    },
    /** Map id → { id, nome } para exibir nomes em listas sem expor dados pessoais. */
    async buscarResumos(ids) {
      const resumos = new Map();
      ids.forEach((id) => {
        const u = usuarios.get(Number(id));
        if (u) resumos.set(u.id, { id: u.id, nome: u.nome });
      });
      return resumos;
    },
  };
}

module.exports = { criarUsuarioRepositoryMemoria };
