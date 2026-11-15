const { tratar } = require('./atividadeController');

function criarConviteController(conviteService) {
  return {
    convidar: tratar(async (req, res) => {
      const convite = await conviteService.convidar(req.params.id, req.body, req.usuario);
      res.status(201).location(`/api/convites/${convite.id}`).json(convite);
    }),

    listarDaAtividade: tratar(async (req, res) => {
      res.json(await conviteService.listarDaAtividade(req.params.id, req.usuario));
    }),

    listarRecebidos: tratar(async (req, res) => {
      res.json(await conviteService.listarRecebidos(req.usuario, req.query));
    }),

    responder: tratar(async (req, res) => {
      res.json(await conviteService.responder(req.params.id, req.usuario, (req.body || {}).decisao));
    }),
  };
}

module.exports = { criarConviteController };
