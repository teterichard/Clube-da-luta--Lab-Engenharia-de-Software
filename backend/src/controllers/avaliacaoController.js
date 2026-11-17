const { tratar } = require('./atividadeController');

/** RF12–RF14 e RF18 — avaliações de atividades, participantes e comunidades. */
function criarAvaliacaoController(avaliacaoService) {
  return {
    avaliarAtividade: tratar(async (req, res) => {
      res.status(201).json(await avaliacaoService.avaliarAtividade(req.params.id, req.body, req.usuario));
    }),
    listarDaAtividade: tratar(async (req, res) => {
      res.json(await avaliacaoService.listarDaAtividade(req.params.id, req.usuario));
    }),
    avaliarParticipante: tratar(async (req, res) => {
      res.status(201).json(await avaliacaoService.avaliarParticipante(
        req.params.id, req.params.usuarioId, req.body, req.usuario,
      ));
    }),
    avaliarComunidade: tratar(async (req, res) => {
      res.status(201).json(await avaliacaoService.avaliarComunidade(req.params.id, req.body, req.usuario));
    }),
    listarDaComunidade: tratar(async (req, res) => {
      res.json(await avaliacaoService.listarDaComunidade(req.params.id, req.usuario));
    }),
  };
}

module.exports = { criarAvaliacaoController };
