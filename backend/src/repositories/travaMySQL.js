const { criarAtividadeRepositoryMySQL } = require('./atividadeRepositoryMySQL');
const { criarParticipacaoRepositoryMySQL } = require('./participacaoRepositoryMySQL');
const { criarConviteRepositoryMySQL } = require('./conviteRepositoryMySQL');

/**
 * Executa `fn` numa transação que trava a linha da atividade (SELECT ... FOR UPDATE).
 * Dois aceites simultâneos na mesma atividade passam a acontecer em sequência, então o
 * segundo já enxerga a vaga ocupada pelo primeiro. Os repositórios entregues a `fn`
 * usam a mesma conexão da transação.
 */
function criarTravaMySQL(pool) {
  return async function comTrava(atividadeId, fn) {
    const conexao = await pool.getConnection();
    try {
      await conexao.beginTransaction();
      await conexao.execute('SELECT id FROM atividade WHERE id = ? FOR UPDATE', [atividadeId]);
      const resultado = await fn({
        atividadeRepository: criarAtividadeRepositoryMySQL(conexao),
        participacaoRepository: criarParticipacaoRepositoryMySQL(conexao),
        conviteRepository: criarConviteRepositoryMySQL(conexao),
      });
      await conexao.commit();
      return resultado;
    } catch (erro) {
      await conexao.rollback();
      throw erro;
    } finally {
      conexao.release();
    }
  };
}

module.exports = { criarTravaMySQL };
