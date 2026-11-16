/** Repositório MySQL de convites (mysql2/promise). */
function paraConvite(l) {
  return {
    id: l.id,
    atividadeId: l.atividade_id,
    convidadoId: l.convidado_id,
    status: l.status,
    criadoEm: l.criado_em,
    respondidoEm: l.respondido_em,
  };
}

function criarConviteRepositoryMySQL(pool) {
  return {
    async salvar(c) {
      const [resultado] = await pool.execute(
        'INSERT INTO convite (atividade_id, convidado_id, status, criado_em) VALUES (?, ?, ?, ?)',
        [c.atividadeId, c.convidadoId, c.status, c.criadoEm],
      );
      return { id: resultado.insertId, ...c };
    },

    async atualizar(c) {
      await pool.execute('UPDATE convite SET status = ?, respondido_em = ? WHERE id = ?', [c.status, c.respondidoEm, c.id]);
      return c;
    },

    async buscarPorId(id) {
      const [linhas] = await pool.execute('SELECT * FROM convite WHERE id = ?', [id]);
      return linhas.length === 0 ? null : paraConvite(linhas[0]);
    },

    async listarPorAtividade(atividadeId) {
      const [linhas] = await pool.execute('SELECT * FROM convite WHERE atividade_id = ? ORDER BY criado_em', [atividadeId]);
      return linhas.map(paraConvite);
    },

    async listarPorConvidado(usuarioId) {
      const [linhas] = await pool.execute(
        'SELECT * FROM convite WHERE convidado_id = ? ORDER BY criado_em DESC',
        [usuarioId],
      );
      return linhas.map(paraConvite);
    },

    async removerPorAtividade(atividadeId) {
      await pool.execute('DELETE FROM convite WHERE atividade_id = ?', [atividadeId]);
    },
  };
}

module.exports = { criarConviteRepositoryMySQL };
