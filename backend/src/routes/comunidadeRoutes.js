const express = require('express');

function comunidadeRoutes({ comunidadeController, avaliacaoController, autenticar }) {
  const router = express.Router();
  router.use(autenticar);

  router.post('/', comunidadeController.criar);
  router.get('/', comunidadeController.listar); // ?busca=croche&modalidade=&publicoAlvo=&comVaga=true
  router.get('/minhas', comunidadeController.listarMinhas); // antes de /:id
  router.get('/:id', comunidadeController.detalhar);
  router.patch('/:id', comunidadeController.editar);

  router.get('/:id/membros', comunidadeController.listarMembros);
  router.post('/:id/membros', comunidadeController.entrar);
  router.delete('/:id/membros/me', comunidadeController.sair);
  // admin: { "decisao": "ACEITAR" | "RECUSAR" } ou { "papel": "ADMIN" }
  router.patch('/:id/membros/:usuarioId', comunidadeController.gerenciarMembro);

  // mural (RF17): { "conteudo": "..." } — só membros ativos
  router.get('/:id/mensagens', comunidadeController.listarMensagens);
  router.post('/:id/mensagens', comunidadeController.enviarMensagem);

  // avaliação da comunidade depois de 3 meses (RF18)
  router.post('/:id/avaliacoes', avaliacaoController.avaliarComunidade);
  router.get('/:id/avaliacoes', avaliacaoController.listarDaComunidade);
  return router;
}

module.exports = { comunidadeRoutes };
