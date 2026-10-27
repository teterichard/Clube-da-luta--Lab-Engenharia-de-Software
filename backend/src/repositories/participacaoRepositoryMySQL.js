/** Repositório MySQL de participações (mysql2/promise). */
function paraParticipacao(l) {
  return {
    id: l.id,
    atividadeId: l.atividade_id,
    usuarioId: l.usuario_id,
    status: l.status,
    solicitadaEm: l.solicitada_em,
    respondidaEm: l.respondida_em,
  };
}

function criarParticipacaoRepositoryMySQL(pool) {
  return {
    async salvar(p) {
      const [resultado] = await pool.execute(
        `INSERT INTO participacao (atividade_id, usuario_id, status, solicitada_em)
         VALUES (?, ?, ?, ?)`,
        [p.atividadeId, p.usuarioId, p.status, p.solicitadaEm],
      );
      return { id: resultado.insertId, ...p };
    },

    async atualizar(p) {
      await pool.execute(
        'UPDATE participacao SET status = ?, respondida_em = ? WHERE id = ?',
        [p.status, p.respondidaEm, p.id],
      );
      return p;
    },

    async buscarPorId(id) {
      const [linhas] = await pool.execute('SELECT * FROM participacao WHERE id = ?', [id]);
      return linhas.length === 0 ? null : paraParticipacao(linhas[0]);
    },

    async listarPorAtividade(atividadeId) {
      const [linhas] = await pool.execute(
        'SELECT * FROM participacao WHERE atividade_id = ? ORDER BY solicitada_em',
        [atividadeId],
      );
      return linhas.map(paraParticipacao);
    },

    async contarAceitas(atividadeIds) {
      const contagem = new Map(atividadeIds.map((id) => [id, 0]));
      if (atividadeIds.length === 0) return contagem;
      const marcadores = atividadeIds.map(() => '?').join(', ');
      const [linhas] = await pool.execute(
        `SELECT atividade_id, COUNT(*) AS total FROM participacao
          WHERE status = 'ACEITO' AND atividade_id IN (${marcadores})
          GROUP BY atividade_id`,
        atividadeIds,
      );
      linhas.forEach((l) => contagem.set(l.atividade_id, Number(l.total)));
      return contagem;
    },
  };
}

module.exports = { criarParticipacaoRepositoryMySQL };
