/** Repositório de avaliações em memória — testes e execução sem banco. */
function criarAvaliacaoRepositoryMemoria() {
  const avaliacoes = new Map();
  let proximoId = 1;
  const igual = (a, b) => String(a) === String(b);
  const recentes = (a, b) => new Date(b.criadaEm) - new Date(a.criadaEm) || b.id - a.id;

  return {
    async salvar(avaliacao) {
      const salva = { id: proximoId++, ...avaliacao };
      avaliacoes.set(salva.id, salva);
      return { ...salva };
    },
    /** A avaliação que um autor já fez para o mesmo alvo (e contexto), ou null. */
    async buscar({
      autorId, tipo, alvoId, contextoId = 0,
    }) {
      const a = [...avaliacoes.values()].find((x) => igual(x.autorId, autorId) && x.tipo === tipo
        && igual(x.alvoId, alvoId) && igual(x.contextoId, contextoId));
      return a ? { ...a } : null;
    },
    async listarPorAlvo(tipo, alvoId) {
      return [...avaliacoes.values()]
        .filter((a) => a.tipo === tipo && igual(a.alvoId, alvoId))
        .sort(recentes)
        .map((a) => ({ ...a }));
    },
    /** Ex.: todas as notas que participantes receberam numa atividade (tipo USUARIO, contexto = atividade). */
    async listarPorContexto(tipo, contextoId) {
      return [...avaliacoes.values()]
        .filter((a) => a.tipo === tipo && igual(a.contextoId, contextoId))
        .sort(recentes)
        .map((a) => ({ ...a }));
    },
  };
}

module.exports = { criarAvaliacaoRepositoryMemoria };
