const { tratar } = require('./atividadeController');

function criarParticipacaoController(participacaoService) {
  return {
    solicitar: tratar(async (req, res) => {
      const participacao = await participacaoService.solicitar(req.params.id, req.usuario);
      res.status(201).location(`/api/participacoes/${participacao.id}`).json(participacao);
    }),

    listarDaAtividade: tratar(async (req, res) => {
      res.json(await participacaoService.listarDaAtividade(req.params.id, req.usuario));
    }),

    responder: tratar(async (req, res) => {
      const decisao = (req.body || {}).decisao;
      res.json(await participacaoService.responder(req.params.id, req.usuario, decisao));
    }),
  };
}

module.exports = { criarParticipacaoController };
