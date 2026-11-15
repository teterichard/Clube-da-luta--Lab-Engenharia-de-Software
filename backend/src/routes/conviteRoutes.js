const express = require('express');

/** Convites recebidos pelo usuário logado. */
function conviteRoutes({ conviteController, autenticar }) {
  const router = express.Router();
  router.use(autenticar);
  router.get('/', conviteController.listarRecebidos); // ?status=PENDENTE
  router.patch('/:id', conviteController.responder); // { "decisao": "ACEITAR" | "RECUSAR" }
  return router;
}

module.exports = { conviteRoutes };
