require('dotenv').config({ quiet: true });

const SEGREDO_PADRAO = 'troque-este-segredo';
const producao = process.env.NODE_ENV === 'production';

// Em produção o segredo do JWT precisa ser trocado: com o padrão, qualquer um forjaria tokens
if (producao && (!process.env.JWT_SECRET || process.env.JWT_SECRET === SEGREDO_PADRAO)) {
  throw new Error('Defina JWT_SECRET (um texto longo e aleatório) antes de subir em produção');
}

/**
 * Banco: aceita uma URL única (Railway expõe MYSQL_URL; outros serviços usam DATABASE_URL)
 * ou as variáveis separadas DB_HOST, DB_PORT... DB_SSL=true para provedores que exigem SSL (ex.: Azure).
 */
function lerBanco() {
  const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined;
  const url = process.env.DATABASE_URL || process.env.MYSQL_URL;
  if (url) {
    const u = new URL(url);
    return {
      host: u.hostname,
      port: Number(u.port) || 3306,
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: decodeURIComponent(u.pathname.replace(/^\//, '')),
      ssl,
    };
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'topaai',
    password: process.env.DB_PASSWORD || 'topaai',
    database: process.env.DB_NAME || 'topaai',
    ssl,
  };
}

module.exports = {
  producao,
  porta: Number(process.env.PORT) || 3000,
  jwtSegredo: process.env.JWT_SECRET || SEGREDO_PADRAO,
  jwtExpiracao: process.env.JWT_EXPIRES_IN || '7d',
  usarMemoria: process.env.DB_IN_MEMORY === 'true',
  // endereço do front em produção, separado por vírgula (CORS). Vazio = nada liberado
  corsOrigem: process.env.CORS_ORIGIN || '',
  // roda db/schema.sql ao subir (tabelas IF NOT EXISTS) — prático no deploy
  criarTabelasAoIniciar: process.env.DB_AUTO_SCHEMA !== 'false',
  db: lerBanco(),
};
