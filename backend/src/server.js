const env = require('./config/env');
const { criarApp } = require('./app');
const { criarRepositoriosMySQL } = require('./repositories/mysql');

function criarRepositorios() {
  if (env.usarMemoria) {
    // o app usa repositórios em memória quando nenhum é informado
    console.log('Usando repositórios em memória (DB_IN_MEMORY=true)');
    return {};
  }
  const mysql = require('mysql2/promise');
  const pool = mysql.createPool({ ...env.db, waitForConnections: true, connectionLimit: 10 });
  return criarRepositoriosMySQL(pool);
}

const app = criarApp({
  ...criarRepositorios(),
  jwtSegredo: env.jwtSegredo,
  jwtExpiracao: env.jwtExpiracao,
});

app.listen(env.porta, () => {
  console.log(`Topa-aí API rodando em http://localhost:${env.porta}`);
});
