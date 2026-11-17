const {
  criarComunidade,
  editarComunidade,
  entrar,
  sair,
  responderPedido,
  promover,
  membrosVisiveis,
  membroDe,
  verificarAcessoAoMural,
  criarMensagem,
} = require('../domain/comunidade');
const { PapelMembro, StatusMembro } = require('../domain/enums');
const { ErroNaoEncontrado } = require('../domain/erros');
const { Eventos } = require('../domain/eventos');
const { idadePermite, verificarFaixaEtaria } = require('../domain/faixaEtaria');

const normalizar = (v) => (typeof v === 'string' ? v : '').trim().toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

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

  /** Perfil completo (com idade) de quem está logado — o token só traz id e nome. */
  async function perfilDe(usuario) {
    return (await usuarioRepository.buscarPorId(usuario.id)) || usuario;
  }

  /** Acrescenta { autor: { id, nome } } nas mensagens do mural. */
  async function comAutores(mensagens) {
    const nomes = await usuarioRepository.buscarResumos([...new Set(mensagens.map((m) => m.autorId))]);
    return mensagens.map((m) => ({ ...m, autor: nomes.get(Number(m.autorId)) || null }));
  }

  /** Acrescenta totalMembros, vagas (null = sem limite) e a minha situação (meuStatus / meuPapel, ou null). */
  async function resumir(comunidades, usuario) {
    const ids = comunidades.map((c) => c.id);
    const [contagem, vinculos] = await Promise.all([
      comunidadeRepository.contarMembrosAtivos(ids),
      comunidadeRepository.listarVinculosDoUsuario(usuario.id),
    ]);
    return comunidades.map((c) => {
      const meu = vinculos.find((v) => String(v.comunidadeId) === String(c.id));
      const totalMembros = contagem.get(Number(c.id)) || 0;
      return {
        ...c,
        totalMembros,
        vagas: c.vagasMaximas == null ? null : Math.max(c.vagasMaximas - totalMembros, 0),
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

    /**
     * Descoberta: todas as comunidades (privadas aparecem para que se possa pedir para entrar).
     * Filtros: busca, modalidade, publicoAlvo, comVaga=true. Quem está fora da faixa etária não vê (RF19).
     */
    async listar(usuario, {
      busca, modalidade, publicoAlvo, comVaga,
    } = {}) {
      const termo = typeof busca === 'string' ? busca.trim() : '';
      const { idade } = await perfilDe(usuario);
      const lista = await resumir(await comunidadeRepository.listar({ busca: termo || undefined }), usuario);
      return lista
        .filter((c) => c.meuStatus || idadePermite(c.publicoAlvo, idade))
        .filter((c) => !modalidade || normalizar(c.modalidade) === normalizar(modalidade))
        .filter((c) => !publicoAlvo || normalizar(c.publicoAlvo) === normalizar(publicoAlvo))
        .filter((c) => comVaga !== 'true' || c.vagas !== 0);
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
      const pedido = entrar(comunidade, membros, usuario, relogio());
      verificarFaixaEtaria(comunidade.publicoAlvo, await perfilDe(usuario), 'comunidade');
      const novo = await comunidadeRepository.adicionarMembro(pedido);
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
        const respondido = responderPedido(membros, usuario, alvoId, d.decisao, comunidade);
        // a contagem dos 3 meses para avaliar (RF18) começa quando a pessoa entra de fato
        const aprovado = respondido && { ...respondido, entrouEm: relogio() };
        if (aprovado) await comunidadeRepository.atualizarMembro(aprovado);
        else await comunidadeRepository.removerMembro(comunidade.id, alvoId);
        await eventos.publicar(Eventos.COMUNIDADE_PEDIDO_RESPONDIDO, {
          comunidade, usuarioId: Number(alvoId), aceito: !!aprovado,
        });
      }
      const atualizado = membroDe(await comunidadeRepository.listarMembros(comunidade.id), { id: alvoId });
      return atualizado || { comunidadeId: comunidade.id, usuarioId: Number(alvoId), status: null };
    },

    /** RF17 — mural: últimas 100 mensagens, só para membros ativos. */
    async listarMensagens(id, usuario) {
      const comunidade = await carregar(id);
      verificarAcessoAoMural(await comunidadeRepository.listarMembros(comunidade.id), usuario);
      return comAutores(await comunidadeRepository.listarMensagens(comunidade.id, 100));
    },

    async enviarMensagem(id, dados, usuario) {
      const comunidade = await carregar(id);
      const membros = await comunidadeRepository.listarMembros(comunidade.id);
      const nova = criarMensagem(comunidade, membros, usuario, (dados || {}).conteudo, relogio());
      const [salva] = await comAutores([await comunidadeRepository.salvarMensagem(nova)]);
      return salva;
    },
  };
}

module.exports = { criarComunidadeService };
