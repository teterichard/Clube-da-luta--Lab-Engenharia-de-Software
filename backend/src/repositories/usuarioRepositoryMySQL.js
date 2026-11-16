/** Repositório MySQL de usuários (mysql2/promise). */
function paraUsuario(l) {
  return {
    id: l.id,
    nome: l.nome,
    email: l.email,
    senhaHash: l.senha_hash,
    localizacao: l.localizacao,
    idade: l.idade,
    proficiencia: l.proficiencia,
    criadoEm: l.criado_em,
  };
}

const COLUNAS = {
  nome: 'nome',
  localizacao: 'localizacao',
  idade: 'idade',
  proficiencia: 'proficiencia',
};

function criarUsuarioRepositoryMySQL(pool) {
  async function buscarPorId(id) {
    const [linhas] = await pool.execute('SELECT * FROM usuario WHERE id = ?', [id]);
    return linhas.length === 0 ? null : paraUsuario(linhas[0]);
  }

  return {
    async salvar(u) {
      const [resultado] = await pool.execute(
        `INSERT INTO usuario (nome, email, senha_hash, localizacao, idade, proficiencia, criado_em)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [u.nome, u.email, u.senhaHash, u.localizacao ?? null, u.idade ?? null,
          u.proficiencia ?? null, u.criadoEm],
      );
      return { id: resultado.insertId, ...u };
    },

    /** Atualiza só as colunas permitidas que vieram em `alteracoes`. */
    async atualizar(id, alteracoes) {
      const campos = Object.keys(alteracoes).filter((c) => COLUNAS[c]);
      if (campos.length > 0) {
        const sets = campos.map((c) => `${COLUNAS[c]} = ?`).join(', ');
        await pool.execute(`UPDATE usuario SET ${sets} WHERE id = ?`, [...campos.map((c) => alteracoes[c]), id]);
      }
      return buscarPorId(id);
    },

    buscarPorId,

    async buscarPorEmail(email) {
      const [linhas] = await pool.execute('SELECT * FROM usuario WHERE email = ?', [email]);
      return linhas.length === 0 ? null : paraUsuario(linhas[0]);
    },

    async buscarResumos(ids) {
      const resumos = new Map();
      if (ids.length === 0) return resumos;
      const marcadores = ids.map(() => '?').join(', ');
      const [linhas] = await pool.execute(`SELECT id, nome FROM usuario WHERE id IN (${marcadores})`, ids);
      linhas.forEach((l) => resumos.set(l.id, { id: l.id, nome: l.nome }));
      return resumos;
    },
  };
}

module.exports = { criarUsuarioRepositoryMySQL };
