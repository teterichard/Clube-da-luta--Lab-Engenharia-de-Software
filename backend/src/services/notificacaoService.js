const {
  TRADUTORES,
  traduzirEvento,
  usuariosDoEvento,
  verificarDono,
} = require('../domain/notificacao');

/**
 * Observador dos eventos de domínio: transforma cada evento em notificações e as grava.
 * Também atende as rotas de leitura (listar, marcar como lida).
 */
function criarNotificacaoService({
  notificacaoRepository,
  usuarioRepository,
  eventos,
  relogio = () => new Date(),
}) {
  async function aoReceberEvento(tipo, dados) {
    const resumos = await usuarioRepository.buscarResumos([...new Set(usuariosDoEvento(dados))]);
    const nome = (id) => resumos.get(Number(id))?.nome || 'Alguém';
    const avisos = traduzirEvento(tipo, dados, nome);
    if (avisos.length === 0) return;
    const agora = relogio();
    await notificacaoRepository.salvarVarias(avisos.map((a) => ({ ...a, lida: false, criadaEm: agora })));
  }

  return {
    /** Assina todos os eventos que geram notificação. Chamado uma vez ao montar o app. */
    registrarObservadores() {
      Object.keys(TRADUTORES).forEach((tipo) => {
        eventos.assinar(tipo, (dados) => aoReceberEvento(tipo, dados));
      });
    },

    async listar(usuario, { naoLidas } = {}) {
      const somenteNaoLidas = naoLidas === true || naoLidas === 'true';
      const [itens, totalNaoLidas] = await Promise.all([
        notificacaoRepository.listarPorUsuario(usuario.id, { somenteNaoLidas }),
        notificacaoRepository.contarNaoLidas(usuario.id),
      ]);
      return { naoLidas: totalNaoLidas, itens };
    },

    async marcarLida(id, usuario) {
      verificarDono(await notificacaoRepository.buscarPorId(id), usuario);
      return notificacaoRepository.marcarLida(id);
    },

    async marcarTodasLidas(usuario) {
      await notificacaoRepository.marcarTodasLidas(usuario.id);
      return { naoLidas: 0 };
    },
  };
}

module.exports = { criarNotificacaoService };
