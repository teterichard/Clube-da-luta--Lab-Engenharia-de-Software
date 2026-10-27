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
  };
}

module.exports = { criarAtividadeController, tratar };
