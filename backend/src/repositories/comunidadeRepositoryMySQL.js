/** Repositório MySQL de comunidades e membros (mysql2/promise). */
function paraComunidade(l) {
  return {
    id: l.id,
    nome: l.nome,
    descricao: l.descricao,
    visibilidade: l.visibilidade,
    criadorId: l.criador_id,
    criadaEm: l.criada_em,
  };
}

function paraMembro(l) {
  return {
    comunidadeId: l.comunidade_id,
    usuarioId: l.usuario_id,
    papel: l.papel,
    status: l.status,
    entrouEm: l.entrou_em,
  };
}

function criarComunidadeRepositoryMySQL(pool) {
  return {
    async salvar(c) {
      const [resultado] = await pool.execute(
        'INSERT INTO comunidade (nome, descricao, visibilidade, criador_id, criada_em) VALUES (?, ?, ?, ?, ?)',
        [c.nome, c.descricao, c.visibilidade, c.criadorId, c.criadaEm],
      );
      return { id: resultado.insertId, ...c };
    },

    async atualizar(c) {
      await pool.execute(
        'UPDATE comunidade SET nome = ?, descricao = ?, visibilidade = ? WHERE id = ?',
        [c.nome, c.descricao, c.visibilidade, c.id],
      );
      return c;
    },

    async buscarPorId(id) {
      const [linhas] = await pool.execute('SELECT * FROM comunidade WHERE id = ?', [id]);
      return linhas.length === 0 ? null : paraComunidade(linhas[0]);
    },

    async listar({ busca } = {}) {
      if (busca) {
        const termo = `%${busca}%`;
        const [linhas] = await pool.execute(
          'SELECT * FROM comunidade WHERE nome LIKE ? OR descricao LIKE ? ORDER BY nome',
          [termo, termo],
        );
        return linhas.map(paraComunidade);
      }
      const [linhas] = await pool.execute('SELECT * FROM comunidade ORDER BY nome');
      return linhas.map(paraComunidade);
    },

    async adicionarMembro(m) {
      await pool.execute(
        'INSERT INTO comunidade_membro (comunidade_id, usuario_id, papel, status, entrou_em) VALUES (?, ?, ?, ?, ?)',
        [m.comunidadeId, m.usuarioId, m.papel, m.status, m.entrouEm],
      );
      return m;
    },

    async atualizarMembro(m) {
      await pool.execute(
        'UPDATE comunidade_membro SET papel = ?, status = ? WHERE comunidade_id = ? AND usuario_id = ?',
        [m.papel, m.status, m.comunidadeId, m.usuarioId],
      );
      return m;
    },

    async removerMembro(comunidadeId, usuarioId) {
      await pool.execute(
        'DELETE FROM comunidade_membro WHERE comunidade_id = ? AND usuario_id = ?',
        [comunidadeId, usuarioId],
      );
    },

    async listarMembros(comunidadeId) {
      const [linhas] = await pool.execute(
        `SELECT * FROM comunidade_membro WHERE comunidade_id = ?
          ORDER BY papel = 'ADMIN' DESC, entrou_em, usuario_id`,
        [comunidadeId],
      );
      return linhas.map(paraMembro);
    },

    async listarVinculosDoUsuario(usuarioId) {
      const [linhas] = await pool.execute('SELECT * FROM comunidade_membro WHERE usuario_id = ?', [usuarioId]);
      return linhas.map(paraMembro);
    },

    async contarMembrosAtivos(ids) {
      const contagem = new Map(ids.map((id) => [Number(id), 0]));
      if (ids.length === 0) return contagem;
      const marcadores = ids.map(() => '?').join(', ');
      const [linhas] = await pool.execute(
        `SELECT comunidade_id, COUNT(*) AS total FROM comunidade_membro
          WHERE status = 'ATIVO' AND comunidade_id IN (${marcadores}) GROUP BY comunidade_id`,
        ids,
      );
      linhas.forEach((l) => contagem.set(Number(l.comunidade_id), Number(l.total)));
      return contagem;
    },
  };
}

module.exports = { criarComunidadeRepositoryMySQL };
