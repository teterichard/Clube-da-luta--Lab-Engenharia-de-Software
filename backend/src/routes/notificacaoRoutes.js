const express = require('express');

function notificacaoRoutes({ notificacaoController, autenticar }) {
  const router = express.Router();
  router.use(autenticar);
  router.get('/', notificacaoController.listar); // ?naoLidas=true
  router.post('/lidas', notificacaoController.marcarTodasLidas);
  router.patch('/:id/lida', notificacaoController.marcarLida);
  return router;
}

module.exports = { notificacaoRoutes };
