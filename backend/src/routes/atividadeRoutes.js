const express = require('express');

/** Todas as rotas exigem login (pré-condição do caso de uso — CT-02). */
function atividadeRoutes({ controller, participacaoController, autenticar }) {
  const router = express.Router();
  router.use(autenticar);

  router.post('/', controller.criar);
  router.get('/', controller.listar);
  router.get('/:id', controller.detalhar);
  router.patch('/:id', controller.editar);
  router.delete('/:id', controller.excluir);

  // ciclo de status (RF11)
  router.post('/:id/iniciar', controller.mudarStatus('iniciar'));
  router.post('/:id/cancelar', controller.mudarStatus('cancelar'));
  router.post('/:id/concluir', controller.mudarStatus('concluir'));

  router.post('/:id/participacoes', participacaoController.solicitar);
  router.get('/:id/participacoes', participacaoController.listarDaAtividade);
  return router;
}

module.exports = { atividadeRoutes };
