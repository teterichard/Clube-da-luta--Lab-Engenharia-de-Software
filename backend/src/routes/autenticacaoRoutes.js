const express = require('express');

/** Rotas públicas de cadastro e login (RF01/RF02). */
function autenticacaoRoutes({ autenticacaoController }) {
  const router = express.Router();
  router.post('/cadastro', autenticacaoController.cadastrar);
  router.post('/login', autenticacaoController.login);
  return router;
}

/** Perfil do usuário logado. */
function usuarioRoutes({ autenticacaoController, autenticar }) {
  const router = express.Router();
  router.use(autenticar);
  router.get('/me', autenticacaoController.perfil);
  router.patch('/me', autenticacaoController.atualizarPerfil);
  return router;
}

module.exports = { autenticacaoRoutes, usuarioRoutes };
