/** Traduz HTTP ↔ serviço. Erros seguem para o tratadorErros via next(). */
const tratar = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (err) {
    next(err);
  }
};

function criarAtividadeController(atividadeService) {
  return {
    criar: tratar(async (req, res) => {
      const atividade = await atividadeService.criar(req.body, req.usuario);
      res.status(201).location(`/api/atividades/${atividade.id}`).json(atividade);
    }),

    listar: tratar(async (req, res) => {
      res.json(await atividadeService.listar(req.query));
    }),

    detalhar: tratar(async (req, res) => {
      res.json(await atividadeService.detalhar(req.params.id, req.usuario));
    }),

    editar: tratar(async (req, res) => {
      res.json(await atividadeService.editar(req.params.id, req.body, req.usuario));
    }),

    /** POST /:id/iniciar | /:id/cancelar | /:id/concluir — a ação vem do fim da rota. */
    mudarStatus: (acao) => tratar(async (req, res) => {
      res.json(await atividadeService.mudarStatus(req.params.id, acao, req.usuario));
    }),

    excluir: tratar(async (req, res) => {
      await atividadeService.excluir(req.params.id, req.usuario);
      res.status(204).end();
    }),
  };
}

module.exports = { criarAtividadeController, tratar };
