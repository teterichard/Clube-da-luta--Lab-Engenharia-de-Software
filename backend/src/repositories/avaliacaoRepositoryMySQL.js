const { ErroRegraNegocio } = require('../domain/erros');

/** Repositório MySQL de avaliações (mysql2/promise). */
function paraAvaliacao(l) {
  return {
    id: l.id,
    autorId: l.autor_id,
    tipo: l.tipo,
    alvoId: l.alvo_id,
    contextoId: l.contexto_id,
    nota: l.nota,
    comentario: l.comentario,
    criadaEm: l.criada_em,
  };
}

function criarAvaliacaoRepositoryMySQL(pool) {
  return {
    async salvar(a) {
      try {
        const [resultado] = await pool.execute(
          `INSERT INTO avaliacao (autor_id, tipo, alvo_id, contexto_id, nota, comentario, criada_em)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [a.autorId, a.tipo, a.alvoId, a.contextoId, a.nota, a.comentario, a.criadaEm],
        );
        return { id: resultado.insertId, ...a };
      } catch (err) {
        // UNIQUE (autor, tipo, alvo, contexto): dois cliques ao mesmo tempo
        if (err.code === 'ER_DUP_ENTRY') throw new ErroRegraNegocio('Você já fez essa avaliação');
        throw err;
      }
    },

    async buscar({
      autorId, tipo, alvoId, contextoId = 0,
    }) {
      const [linhas] = await pool.execute(
        'SELECT * FROM avaliacao WHERE autor_id = ? AND tipo = ? AND alvo_id = ? AND contexto_id = ?',
        [autorId, tipo, alvoId, contextoId],
      );
      return linhas.length === 0 ? null : paraAvaliacao(linhas[0]);
    },

    async listarPorAlvo(tipo, alvoId) {
      const [linhas] = await pool.execute(
        'SELECT * FROM avaliacao WHERE tipo = ? AND alvo_id = ? ORDER BY criada_em DESC, id DESC',
        [tipo, alvoId],
      );
      return linhas.map(paraAvaliacao);
    },

    async listarPorContexto(tipo, contextoId) {
      const [linhas] = await pool.execute(
        'SELECT * FROM avaliacao WHERE tipo = ? AND contexto_id = ? ORDER BY criada_em DESC, id DESC',
        [tipo, contextoId],
      );
      return linhas.map(paraAvaliacao);
    },
  };
}

module.exports = { criarAvaliacaoRepositoryMySQL };
