const express = require('express');

/** Todas as rotas exigem login (pré-condição do caso de uso — CT-02). */
function atividadeRoutes({
  controller, participacaoController, conviteController, avaliacaoController, autenticar,
}) {
  const router = express.Router();
  router.use(autenticar);

  router.post('/', controller.criar);
  router.get('/', controller.listar);
  router.get('/organizadas', controller.listarOrganizadas); // antes de /:id
  router.get('/:id', controller.detalhar);
  router.patch('/:id', controller.editar);
  router.delete('/:id', controller.excluir);

  // ciclo de status (RF11)
  router.post('/:id/iniciar', controller.mudarStatus('iniciar'));
  router.post('/:id/cancelar', controller.mudarStatus('cancelar'));
  router.post('/:id/concluir', controller.mudarStatus('concluir'));

  router.post('/:id/participacoes', participacaoController.solicitar);
  router.get('/:id/participacoes', participacaoController.listarDaAtividade);

  // convites (RF07): { "email": "pessoa@exemplo.com" }
  router.post('/:id/convites', conviteController.convidar);
  router.get('/:id/convites', conviteController.listarDaAtividade);

  // avaliações depois de concluída (RF12–RF14): { "nota": 1-5, "comentario"? }
  router.post('/:id/avaliacoes', avaliacaoController.avaliarAtividade);
  router.get('/:id/avaliacoes', avaliacaoController.listarDaAtividade);
  router.post('/:id/participantes/:usuarioId/avaliacao', avaliacaoController.avaliarParticipante);
  return router;
}

module.exports = { atividadeRoutes };
