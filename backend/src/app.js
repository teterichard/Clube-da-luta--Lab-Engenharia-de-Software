const express = require('express');
const { autenticacao } = require('./middlewares/autenticacao');
const { tratadorErros } = require('./middlewares/tratadorErros');
const { criarAtividadeService } = require('./services/atividadeService');
const { criarAtividadeController } = require('./controllers/atividadeController');
const { atividadeRoutes } = require('./routes/atividadeRoutes');

/**
 * Monta a aplicação Express sem subir o servidor (facilita testes com Supertest).
 * Dependências são injetadas: troque o repositório para usar memória ou MySQL.
 */
function criarApp({ atividadeRepository, jwtSegredo, relogio }) {
  const app = express();
  app.use(express.json());

  const atividadeService = criarAtividadeService({ atividadeRepository, relogio });
  const controller = criarAtividadeController(atividadeService);
  const autenticar = autenticacao(jwtSegredo);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/atividades', atividadeRoutes({ controller, autenticar }));

  app.use(tratadorErros);
  return app;
}

module.exports = { criarApp };
