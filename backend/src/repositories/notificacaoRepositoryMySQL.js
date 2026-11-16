/** Repositório MySQL de notificações (mysql2/promise). */
function paraNotificacao(l) {
  return {
    id: l.id,
    usuarioId: l.usuario_id,
    tipo: l.tipo,
    mensagem: l.mensagem,
    atividadeId: l.atividade_id,
    comunidadeId: l.comunidade_id,
    lida: Boolean(l.lida),
    criadaEm: l.criada_em,
  };
}

function criarNotificacaoRepositoryMySQL(pool) {
  return {
    async salvarVarias(lista) {
      const salvas = [];
      for (const n of lista) {
        // eslint-disable-next-line no-await-in-loop
        const [resultado] = await pool.execute(
          `INSERT INTO notificacao (usuario_id, tipo, mensagem, atividade_id, comunidade_id, lida, criada_em)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [n.usuarioId, n.tipo, n.mensagem, n.atividadeId ?? null, n.comunidadeId ?? null, n.lida ? 1 : 0, n.criadaEm],
        );
        salvas.push({ id: resultado.insertId, ...n });
      }
      return salvas;
    },

    async buscarPorId(id) {
      const [linhas] = await pool.execute('SELECT * FROM notificacao WHERE id = ?', [id]);
      return linhas.length === 0 ? null : paraNotificacao(linhas[0]);
    },

    async listarPorUsuario(usuarioId, { somenteNaoLidas = false, limite = 50 } = {}) {
      const filtro = somenteNaoLidas ? 'AND lida = 0' : '';
      const [linhas] = await pool.query(
        `SELECT * FROM notificacao WHERE usuario_id = ? ${filtro} ORDER BY criada_em DESC, id DESC LIMIT ?`,
        [usuarioId, Number(limite)],
      );
      return linhas.map(paraNotificacao);
    },

    async contarNaoLidas(usuarioId) {
      const [linhas] = await pool.execute(
        'SELECT COUNT(*) AS total FROM notificacao WHERE usuario_id = ? AND lida = 0',
        [usuarioId],
      );
      return Number(linhas[0].total);
    },

    async marcarLida(id) {
      await pool.execute('UPDATE notificacao SET lida = 1 WHERE id = ?', [id]);
      return this.buscarPorId(id);
    },

    async marcarTodasLidas(usuarioId) {
      await pool.execute('UPDATE notificacao SET lida = 1 WHERE usuario_id = ? AND lida = 0', [usuarioId]);
    },
  };
}

module.exports = { criarNotificacaoRepositoryMySQL };
