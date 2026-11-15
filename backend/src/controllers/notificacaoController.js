const { tratar } = require('./atividadeController');

function criarNotificacaoController(notificacaoService) {
  return {
    listar: tratar(async (req, res) => {
      res.json(await notificacaoService.listar(req.usuario, req.query));
    }),
    marcarLida: tratar(async (req, res) => {
      res.json(await notificacaoService.marcarLida(req.params.id, req.usuario));
    }),
    marcarTodasLidas: tratar(async (req, res) => {
      res.json(await notificacaoService.marcarTodasLidas(req.usuario));
    }),
  };
}

module.exports = { criarNotificacaoController };
