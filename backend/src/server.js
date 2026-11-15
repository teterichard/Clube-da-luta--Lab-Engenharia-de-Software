const env = require('./config/env');
const { criarApp } = require('./app');
const { criarAtividadeRepositoryMemoria } = require('./repositories/atividadeRepositoryMemoria');
const { criarAtividadeRepositoryMySQL } = require('./repositories/atividadeRepositoryMySQL');
const { criarParticipacaoRepositoryMemoria } = require('./repositories/participacaoRepositoryMemoria');
const { criarParticipacaoRepositoryMySQL } = require('./repositories/participacaoRepositoryMySQL');
const { criarUsuarioRepositoryMemoria } = require('./repositories/usuarioRepositoryMemoria');
const { criarUsuarioRepositoryMySQL } = require('./repositories/usuarioRepositoryMySQL');

function criarRepositorios() {
  if (env.usarMemoria) {
    console.log('Usando repositórios em memória (DB_IN_MEMORY=true)');
    return {
      atividadeRepository: criarAtividadeRepositoryMemoria(),
      participacaoRepository: criarParticipacaoRepositoryMemoria(),
      usuarioRepository: criarUsuarioRepositoryMemoria(),
    };
  }
  const mysql = require('mysql2/promise');
  const pool = mysql.createPool({ ...env.db, waitForConnections: true, connectionLimit: 10 });
  return {
    atividadeRepository: criarAtividadeRepositoryMySQL(pool),
    participacaoRepository: criarParticipacaoRepositoryMySQL(pool),
    usuarioRepository: criarUsuarioRepositoryMySQL(pool),
  };
}

const app = criarApp({
  ...criarRepositorios(),
  jwtSegredo: env.jwtSegredo,
  jwtExpiracao: env.jwtExpiracao,
});

app.listen(env.porta, () => {
  console.log(`Topa-aí API rodando em http://localhost:${env.porta}`);
});
