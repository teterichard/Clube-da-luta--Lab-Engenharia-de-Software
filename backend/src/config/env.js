require('dotenv').config({ quiet: true });

module.exports = {
  porta: Number(process.env.PORT) || 3000,
  jwtSegredo: process.env.JWT_SECRET || 'troque-este-segredo',
  usarMemoria: process.env.DB_IN_MEMORY === 'true',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'topaai',
    password: process.env.DB_PASSWORD || 'topaai',
    database: process.env.DB_NAME || 'topaai',
  },
};
