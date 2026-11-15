const express = require('express');

function participacaoRoutes({ participacaoController, autenticar }) {
  const router = express.Router();
  router.use(autenticar);

  router.get('/minhas', participacaoController.listarMinhas);

  // organizador responde — corpo: { "decisao": "ACEITAR" | "RECUSAR" }
  router.patch('/:id', participacaoController.responder);

  // participante desiste (P6)
  router.post('/:id/cancelar', participacaoController.cancelar);
  return router;
}

module.exports = { participacaoRoutes };
