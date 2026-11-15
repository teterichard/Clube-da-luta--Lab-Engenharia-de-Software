const express = require('express');
const { autenticacao } = require('./middlewares/autenticacao');
const { tratadorErros } = require('./middlewares/tratadorErros');
const { criarAtividadeService } = require('./services/atividadeService');
const { criarParticipacaoService } = require('./services/participacaoService');
const { criarAtividadeController } = require('./controllers/atividadeController');
const { criarParticipacaoController } = require('./controllers/participacaoController');
const { atividadeRoutes } = require('./routes/atividadeRoutes');
const { participacaoRoutes } = require('./routes/participacaoRoutes');
const { criarAutenticacaoService } = require('./services/autenticacaoService');
const { criarAutenticacaoController } = require('./controllers/autenticacaoController');
const { autenticacaoRoutes, usuarioRoutes } = require('./routes/autenticacaoRoutes');
const { criarAtividadeRepositoryMemoria } = require('./repositories/atividadeRepositoryMemoria');
const { criarParticipacaoRepositoryMemoria } = require('./repositories/participacaoRepositoryMemoria');
const { criarUsuarioRepositoryMemoria } = require('./repositories/usuarioRepositoryMemoria');

/**
 * Monta a aplicação Express sem subir o servidor (facilita testes com Supertest).
 * Dependências são injetadas: troque os repositórios para usar memória ou MySQL.
 */
function criarApp({
  atividadeRepository = criarAtividadeRepositoryMemoria(),
  participacaoRepository = criarParticipacaoRepositoryMemoria(),
  usuarioRepository = criarUsuarioRepositoryMemoria(),
  jwtSegredo,
  jwtExpiracao,
  custoBcrypt,
  relogio,
}) {
  const app = express();
  app.use(express.json());

  const deps = { atividadeRepository, participacaoRepository, usuarioRepository, relogio };
  const controller = criarAtividadeController(criarAtividadeService(deps));
  const participacaoController = criarParticipacaoController(criarParticipacaoService(deps));
  const autenticacaoController = criarAutenticacaoController(criarAutenticacaoService({
    ...deps, jwtSegredo, jwtExpiracao, custoBcrypt,
  }));
  const autenticar = autenticacao(jwtSegredo);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', autenticacaoRoutes({ autenticacaoController }));
  app.use('/api/usuarios', usuarioRoutes({ autenticacaoController, autenticar }));
  app.use('/api/atividades', atividadeRoutes({ controller, participacaoController, autenticar }));
  app.use('/api/participacoes', participacaoRoutes({ participacaoController, autenticar }));

  app.use(tratadorErros);
  return app;
}

module.exports = { criarApp };
