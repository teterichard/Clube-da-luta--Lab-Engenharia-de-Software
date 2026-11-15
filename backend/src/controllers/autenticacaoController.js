const { tratar } = require('./atividadeController');

function criarAutenticacaoController(autenticacaoService) {
  return {
    cadastrar: tratar(async (req, res) => {
      res.status(201).json(await autenticacaoService.cadastrar(req.body));
    }),

    login: tratar(async (req, res) => {
      res.json(await autenticacaoService.login(req.body));
    }),

    perfil: tratar(async (req, res) => {
      res.json(await autenticacaoService.perfil(req.usuario));
    }),

    atualizarPerfil: tratar(async (req, res) => {
      res.json(await autenticacaoService.atualizarPerfil(req.usuario, req.body));
    }),
  };
}

module.exports = { criarAutenticacaoController };
