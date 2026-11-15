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
const { criarConviteRepositoryMemoria } = require('./repositories/conviteRepositoryMemoria');
const { criarConviteService } = require('./services/conviteService');
const { criarConviteController } = require('./controllers/conviteController');
const { conviteRoutes } = require('./routes/conviteRoutes');
const { criarTravaMemoria } = require('./repositories/travaMemoria');
const { criarPublicador } = require('./domain/eventos');

/**
 * Monta a aplicação Express sem subir o servidor (facilita testes com Supertest).
 * Dependências são injetadas: troque os repositórios para usar memória ou MySQL.
 */
function criarApp({
  atividadeRepository = criarAtividadeRepositoryMemoria(),
  participacaoRepository = criarParticipacaoRepositoryMemoria(),
  usuarioRepository = criarUsuarioRepositoryMemoria(),
  conviteRepository = criarConviteRepositoryMemoria(),
  comTrava,
  eventos = criarPublicador(),
  jwtSegredo,
  jwtExpiracao,
  custoBcrypt,
  relogio,
}) {
  const app = express();
  app.use(express.json());

  const repositorios = { atividadeRepository, participacaoRepository, conviteRepository };
  const deps = {
    ...repositorios,
    usuarioRepository,
    comTrava: comTrava || criarTravaMemoria(repositorios),
    eventos,
    relogio,
  };
  const controller = criarAtividadeController(criarAtividadeService(deps));
  const participacaoController = criarParticipacaoController(criarParticipacaoService(deps));
  const conviteController = criarConviteController(criarConviteService(deps));
  const autenticacaoController = criarAutenticacaoController(criarAutenticacaoService({
    ...deps, jwtSegredo, jwtExpiracao, custoBcrypt,
  }));
  const autenticar = autenticacao(jwtSegredo);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', autenticacaoRoutes({ autenticacaoController }));
  app.use('/api/usuarios', usuarioRoutes({ autenticacaoController, autenticar }));
  app.use('/api/atividades', atividadeRoutes({
    controller, participacaoController, conviteController, autenticar,
  }));
  app.use('/api/convites', conviteRoutes({ conviteController, autenticar }));
  app.use('/api/participacoes', participacaoRoutes({ participacaoController, autenticar }));

  app.use(tratadorErros);
  return app;
}

module.exports = { criarApp };
