const env = require('./config/env');
const { criarApp } = require('./app');
const { criarAtividadeRepositoryMemoria } = require('./repositories/atividadeRepositoryMemoria');
const { criarAtividadeRepositoryMySQL } = require('./repositories/atividadeRepositoryMySQL');
const { criarParticipacaoRepositoryMemoria } = require('./repositories/participacaoRepositoryMemoria');
const { criarParticipacaoRepositoryMySQL } = require('./repositories/participacaoRepositoryMySQL');

function criarRepositorios() {
  if (env.usarMemoria) {
    console.log('Usando repositórios em memória (DB_IN_MEMORY=true)');
    return {
      atividadeRepository: criarAtividadeRepositoryMemoria(),
      participacaoRepository: criarParticipacaoRepositoryMemoria(),
    };
  }
  const mysql = require('mysql2/promise');
  const pool = mysql.createPool({ ...env.db, waitForConnections: true, connectionLimit: 10 });
  return {
    atividadeRepository: criarAtividadeRepositoryMySQL(pool),
    participacaoRepository: criarParticipacaoRepositoryMySQL(pool),
  };
}

const app = criarApp({ ...criarRepositorios(), jwtSegredo: env.jwtSegredo });

app.listen(env.porta, () => {
  console.log(`Topa-aí API rodando em http://localhost:${env.porta}`);
});
