const env = require('./config/env');
const { criarApp } = require('./app');
const { criarRepositoriosMySQL } = require('./repositories/mysql');
const { criarTabelas } = require('./config/banco');

async function criarRepositorios() {
  if (env.usarMemoria) {
    // o app usa repositórios em memória quando nenhum é informado
    console.log('Usando repositórios em memória (DB_IN_MEMORY=true)');
    return {};
  }
  if (env.criarTabelasAoIniciar) {
    await criarTabelas(env.db);
    console.log('Tabelas conferidas (db/schema.sql)');
  }
  const mysql = require('mysql2/promise');
  const pool = mysql.createPool({ ...env.db, waitForConnections: true, connectionLimit: 10 });
  return criarRepositoriosMySQL(pool);
}

criarRepositorios()
  .then((repositorios) => {
    const app = criarApp({
      ...repositorios,
      jwtSegredo: env.jwtSegredo,
      jwtExpiracao: env.jwtExpiracao,
      corsOrigem: env.corsOrigem,
    });
    app.listen(env.porta, () => {
      console.log(`Topa-aí API rodando na porta ${env.porta}`);
    });
  })
  .catch((err) => {
    console.error('Não foi possível iniciar a API:', err.message);
    process.exit(1);
  });
