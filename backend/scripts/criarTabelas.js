// Cria as tabelas no banco configurado no .env (ou DATABASE_URL / MYSQL_URL). Uso: npm run db:init
const env = require('../src/config/env');
const { criarTabelas } = require('../src/config/banco');

criarTabelas(env.db)
  .then(() => console.log(`Tabelas criadas/conferidas em ${env.db.host}/${env.db.database}`))
  .catch((err) => {
    console.error('Erro ao criar tabelas:', err.message);
    process.exit(1);
  });
