// Gera um token JWT de teste (atalho de desenvolvimento — o fluxo normal é POST /api/auth/login).
// Uso: node scripts/gerarToken.js <id> <nome>
//   ex.: node scripts/gerarToken.js 1 Organizador
//        node scripts/gerarToken.js 2 Joao
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');

const id = Number(process.argv[2]) || 1;
const nome = process.argv[3] || 'Usuario';

console.log(jwt.sign({ sub: id, nome }, env.jwtSegredo, { expiresIn: '7d' }));
