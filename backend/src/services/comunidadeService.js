const {
  criarComunidade,
  editarComunidade,
  entrar,
  sair,
  responderPedido,
  promover,
  membrosVisiveis,
  membroDe,
} = require('../domain/comunidade');
const { PapelMembro, StatusMembro } = require('../domain/enums');
const { ErroNaoEncontrado } = require('../domain/erros');
const { Eventos } = require('../domain/eventos');

/** Comunidades de interesse: criar, descobrir, entrar/sair e administrar membros. */
function criarComunidadeService({
  comunidadeRepository,
  usuarioRepository,
  eventos,
  relogio = () => new Date(),
}) {
  async function carregar(id) {
    const comunidade = await comunidadeRepository.buscarPorId(id);
    if (!comunidade) throw new ErroNaoEncontrado('Comunidade não encontrada');
    return comunidade;
  }

  /** Acrescenta totalMembros e a minha situação (meuStatus / meuPapel, ou null). */
  async function resumir(comunidades, usuario) {
    const ids = comunidades.map((c) => c.id);
    const [contagem, vinculos] = await Promise.all([
      comunidadeRepository.contarMembrosAtivos(ids),
      comunidadeRepository.listarVinculosDoUsuario(usuario.id),
    ]);
    return comunidades.map((c) => {
      const meu = vinculos.find((v) => String(v.comunidadeId) === String(c.id));
      return {
        ...c,
        totalMembros: contagem.get(Number(c.id)) || 0,
        meuStatus: meu ? meu.status : null,
        meuPapel: meu ? meu.papel : null,
      };
    });
  }

  async function detalhar(id, usuario) {
    const [resumo] = await resumir([await carregar(id)], usuario);
    return resumo;
  }

  return {
    async criar(dados, usuario) {
      const agora = relogio();
      const salva = await comunidadeRepository.salvar(criarComunidade(dados, usuario, agora));
      await comunidadeRepository.adicionarMembro({
        comunidadeId: salva.id,
        usuarioId: usuario.id,
        papel: PapelMembro.ADMIN,
        status: StatusMembro.ATIVO,
        entrouEm: agora,
      });
      return detalhar(salva.id, usuario);
    },

    /** Descoberta: todas as comunidades (privadas aparecem para que se possa pedir para entrar). */
    async listar(usuario, { busca } = {}) {
      const termo = typeof busca === 'string' ? busca.trim() : '';
      return resumir(await comunidadeRepository.listar({ busca: termo || undefined }), usuario);
    },

    /** Comunidades das quais faço parte (inclusive pedidos aguardando aprovação). */
    async listarMinhas(usuario) {
      const vinculos = await comunidadeRepository.listarVinculosDoUsuario(usuario.id);
      const comunidades = (await Promise.all(vinculos.map((v) => comunidadeRepository.buscarPorId(v.comunidadeId))))
        .filter(Boolean)
        .sort((a, b) => a.nome.localeCompare(b.nome));
      return resumir(comunidades, usuario);
    },

    detalhar,

    async editar(id, dados, usuario) {
      const atual = await carregar(id);
      const membros = await comunidadeRepository.listarMembros(atual.id);
      await comunidadeRepository.atualizar(editarComunidade(atual, dados, membros, usuario));
      return detalhar(atual.id, usuario);
    },

    async listarMembros(id, usuario) {
      const comunidade = await carregar(id);
      const visiveis = membrosVisiveis(comunidade, await comunidadeRepository.listarMembros(comunidade.id), usuario);
      const nomes = await usuarioRepository.buscarResumos(visiveis.map((m) => m.usuarioId));
      return visiveis.map((m) => ({ ...m, usuario: nomes.get(Number(m.usuarioId)) || null }));
    },

    async entrar(id, usuario) {
      const comunidade = await carregar(id);
      const membros = await comunidadeRepository.listarMembros(comunidade.id);
      const novo = await comunidadeRepository.adicionarMembro(entrar(comunidade, membros, usuario, relogio()));
      if (novo.status === StatusMembro.PENDENTE) {
        const admins = membros.filter((m) => m.papel === PapelMembro.ADMIN && m.status === StatusMembro.ATIVO);
        await eventos.publicar(Eventos.COMUNIDADE_PEDIDO_ENTRADA, {
          comunidade, membro: novo, adminIds: admins.map((a) => a.usuarioId),
        });
      }
      return detalhar(comunidade.id, usuario);
    },

    async sair(id, usuario) {
      const comunidade = await carregar(id);
      const membro = sair(await comunidadeRepository.listarMembros(comunidade.id), usuario);
      await comunidadeRepository.removerMembro(comunidade.id, membro.usuarioId);
      return detalhar(comunidade.id, usuario);
    },

    /** Admin aprova/recusa ({ decisao }) ou promove ({ papel: "ADMIN" }) um membro. */
    async gerenciarMembro(id, alvoId, dados, usuario) {
      const comunidade = await carregar(id);
      const membros = await comunidadeRepository.listarMembros(comunidade.id);
      const d = dados || {};

      if (d.papel !== undefined) {
        await comunidadeRepository.atualizarMembro(promover(membros, usuario, alvoId));
      } else {
        const aprovado = responderPedido(membros, usuario, alvoId, d.decisao);
        if (aprovado) await comunidadeRepository.atualizarMembro(aprovado);
        else await comunidadeRepository.removerMembro(comunidade.id, alvoId);
        await eventos.publicar(Eventos.COMUNIDADE_PEDIDO_RESPONDIDO, {
          comunidade, usuarioId: Number(alvoId), aceito: !!aprovado,
        });
      }
      const atualizado = membroDe(await comunidadeRepository.listarMembros(comunidade.id), { id: alvoId });
      return atualizado || { comunidadeId: comunidade.id, usuarioId: Number(alvoId), status: null };
    },
  };
}

module.exports = { criarComunidadeService };
