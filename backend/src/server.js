const env = require('./config/env');
const { criarApp } = require('./app');
const { criarAtividadeRepositoryMemoria } = require('./repositories/atividadeRepositoryMemoria');
const { criarAtividadeRepositoryMySQL } = require('./repositories/atividadeRepositoryMySQL');

function criarRepositorio() {
  if (env.usarMemoria) {
    console.log('Usando repositório em memória (DB_IN_MEMORY=true)');
    return criarAtividadeRepositoryMemoria();
  }
  const mysql = require('mysql2/promise');
  const pool = mysql.createPool({ ...env.db, waitForConnections: true, connectionLimit: 10 });
  return criarAtividadeRepositoryMySQL(pool);
}

const app = criarApp({ atividadeRepository: criarRepositorio(), jwtSegredo: env.jwtSegredo });

app.listen(env.porta, () => {
  console.log(`Topa-aí API rodando em http://localhost:${env.porta}`);
});
