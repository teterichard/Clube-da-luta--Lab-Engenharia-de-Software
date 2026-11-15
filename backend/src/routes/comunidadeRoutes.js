const express = require('express');

function comunidadeRoutes({ comunidadeController, autenticar }) {
  const router = express.Router();
  router.use(autenticar);

  router.post('/', comunidadeController.criar);
  router.get('/', comunidadeController.listar); // ?busca=croche
  router.get('/minhas', comunidadeController.listarMinhas); // antes de /:id
  router.get('/:id', comunidadeController.detalhar);
  router.patch('/:id', comunidadeController.editar);

  router.get('/:id/membros', comunidadeController.listarMembros);
  router.post('/:id/membros', comunidadeController.entrar);
  router.delete('/:id/membros/me', comunidadeController.sair);
  // admin: { "decisao": "ACEITAR" | "RECUSAR" } ou { "papel": "ADMIN" }
  router.patch('/:id/membros/:usuarioId', comunidadeController.gerenciarMembro);
  return router;
}

module.exports = { comunidadeRoutes };
