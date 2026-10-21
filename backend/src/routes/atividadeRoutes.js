const express = require('express');

function atividadeRoutes({ controller, autenticar }) {
  const router = express.Router();
  router.post('/', autenticar, controller.criar);
  return router;
}

module.exports = { atividadeRoutes };
