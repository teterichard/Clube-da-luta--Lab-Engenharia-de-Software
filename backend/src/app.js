const express = require('express');
const { autenticacao } = require('./middlewares/autenticacao');
const { tratadorErros } = require('./middlewares/tratadorErros');
const { criarAtividadeService } = require('./services/atividadeService');
const { criarParticipacaoService } = require('./services/participacaoService');
const { criarAtividadeController } = require('./controllers/atividadeController');
const { criarParticipacaoController } = require('./controllers/participacaoController');
const { atividadeRoutes } = require('./routes/atividadeRoutes');
const { participacaoRoutes } = require('./routes/participacaoRoutes');
const { criarParticipacaoRepositoryMemoria } = require('./repositories/participacaoRepositoryMemoria');

/**
 * Monta a aplicação Express sem subir o servidor (facilita testes com Supertest).
 * Dependências são injetadas: troque os repositórios para usar memória ou MySQL.
 */
function criarApp({
  atividadeRepository,
  participacaoRepository = criarParticipacaoRepositoryMemoria(),
  jwtSegredo,
  relogio,
}) {
  const app = express();
  app.use(express.json());

  const deps = { atividadeRepository, participacaoRepository, relogio };
  const controller = criarAtividadeController(criarAtividadeService(deps));
  const participacaoController = criarParticipacaoController(criarParticipacaoService(deps));
  const autenticar = autenticacao(jwtSegredo);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/atividades', atividadeRoutes({ controller, participacaoController, autenticar }));
  app.use('/api/participacoes', participacaoRoutes({ participacaoController, autenticar }));

  app.use(tratadorErros);
  return app;
}

module.exports = { criarApp };
