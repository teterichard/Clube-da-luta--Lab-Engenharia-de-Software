/** Repositório MySQL (mysql2/promise). Recebe um pool criado em server.js. */
function paraAtividade(l) {
  return {
    id: l.id,
    titulo: l.titulo,
    descricao: l.descricao,
    tipo: l.tipo,
    nivel: l.nivel,
    publicoAlvo: l.publico_alvo,
    dataHora: l.data_hora,
    local: l.local,
    numeroIntegrantes: l.numero_integrantes,
    visibilidade: l.visibilidade,
    status: l.status,
    organizadorId: l.organizador_id,
    criadaEm: l.criada_em,
  };
}

function criarAtividadeRepositoryMySQL(pool) {
  return {
    async salvar(a) {
      const [resultado] = await pool.execute(
        `INSERT INTO atividade
           (titulo, descricao, tipo, nivel, publico_alvo, data_hora, local,
            numero_integrantes, visibilidade, status, organizador_id, criada_em)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [a.titulo, a.descricao, a.tipo, a.nivel, a.publicoAlvo, a.dataHora, a.local,
          a.numeroIntegrantes, a.visibilidade, a.status, a.organizadorId, a.criadaEm],
      );
      return { id: resultado.insertId, ...a };
    },

    async buscarPorId(id) {
      const [linhas] = await pool.execute('SELECT * FROM atividade WHERE id = ?', [id]);
      return linhas.length === 0 ? null : paraAtividade(linhas[0]);
    },

    /** Públicas, agendadas e futuras. Os filtros (Strategy) são aplicados no serviço. */
    async listarAbertas(agora) {
      const [linhas] = await pool.execute(
        `SELECT * FROM atividade
          WHERE visibilidade = 'PUBLICA' AND status = 'AGENDADA' AND data_hora > ?
          ORDER BY data_hora`,
        [agora],
      );
      return linhas.map(paraAtividade);
    },
  };
}

module.exports = { criarAtividadeRepositoryMySQL };
