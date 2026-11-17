const { tratar } = require('./atividadeController');

function criarComunidadeController(comunidadeService) {
  return {
    criar: tratar(async (req, res) => {
      const comunidade = await comunidadeService.criar(req.body, req.usuario);
      res.status(201).location(`/api/comunidades/${comunidade.id}`).json(comunidade);
    }),
    listar: tratar(async (req, res) => {
      res.json(await comunidadeService.listar(req.usuario, req.query));
    }),
    listarMinhas: tratar(async (req, res) => {
      res.json(await comunidadeService.listarMinhas(req.usuario));
    }),
    detalhar: tratar(async (req, res) => {
      res.json(await comunidadeService.detalhar(req.params.id, req.usuario));
    }),
    editar: tratar(async (req, res) => {
      res.json(await comunidadeService.editar(req.params.id, req.body, req.usuario));
    }),
    listarMembros: tratar(async (req, res) => {
      res.json(await comunidadeService.listarMembros(req.params.id, req.usuario));
    }),
    entrar: tratar(async (req, res) => {
      res.status(201).json(await comunidadeService.entrar(req.params.id, req.usuario));
    }),
    sair: tratar(async (req, res) => {
      res.json(await comunidadeService.sair(req.params.id, req.usuario));
    }),
    listarMensagens: tratar(async (req, res) => {
      res.json(await comunidadeService.listarMensagens(req.params.id, req.usuario));
    }),
    enviarMensagem: tratar(async (req, res) => {
      res.status(201).json(await comunidadeService.enviarMensagem(req.params.id, req.body, req.usuario));
    }),
    gerenciarMembro: tratar(async (req, res) => {
      res.json(await comunidadeService.gerenciarMembro(req.params.id, req.params.usuarioId, req.body, req.usuario));
    }),
  };
}

module.exports = { criarComunidadeController };
