function criarAtividadeController(atividadeService) {
  return {
    async criar(req, res, next) {
      try {
        const atividade = await atividadeService.criar(req.body, req.usuario);
        res.status(201).location(`/api/atividades/${atividade.id}`).json(atividade);
      } catch (err) {
        next(err);
      }
    },
  };
}

module.exports = { criarAtividadeController };
