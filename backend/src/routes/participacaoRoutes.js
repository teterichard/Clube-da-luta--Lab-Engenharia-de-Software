const express = require('express');

function participacaoRoutes({ participacaoController, autenticar }) {
  const router = express.Router();
  router.use(autenticar);

  // corpo: { "decisao": "ACEITAR" | "RECUSAR" }
  router.patch('/:id', participacaoController.responder);
  return router;
}

module.exports = { participacaoRoutes };
