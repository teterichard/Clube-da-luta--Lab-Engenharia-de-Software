const fs = require('fs');
const path = require('path');

/** Roda db/schema.sql no banco (todas as tabelas são IF NOT EXISTS, então pode rodar sempre). */
async function criarTabelas(configBanco) {
  const mysql = require('mysql2/promise');
  const sql = fs.readFileSync(path.join(__dirname, '..', '..', 'db', 'schema.sql'), 'utf8');
  const conexao = await mysql.createConnection({ ...configBanco, multipleStatements: true });
  try {
    await conexao.query(sql);
  } finally {
    await conexao.end();
  }
}

module.exports = { criarTabelas };
