const { criarAvaliacao, resumir, podeAvaliarComunidadeEm } = require('../domain/avaliacao');
const { ehOrganizador } = require('../domain/participacao');
const { podeVerPorConvite } = require('../domain/convite');
const { membroDe, ehMembroAtivo } = require('../domain/comunidade');
const {
  TipoAvaliacao, StatusAtividade, StatusParticipacao, Visibilidade,
} = require('../domain/enums');
const { ErroNaoEncontrado, ErroProibido, ErroRegraNegocio } = require('../domain/erros');
const { Eventos } = require('../domain/eventos');

const mesmoId = (a, b) => a != null && b != null && String(a) === String(b);

/**
 * RF12 — avaliação da atividade depois de concluída; RF13 — participantes avaliam a atividade;
 * RF14 — organizador avalia os participantes; RF18 — membros avaliam a comunidade após 3 meses.
 * RNF07 — as avaliações ficam guardadas (histórico e reputação no perfil).
 */
function criarAvaliacaoService({
  atividadeRepository,
  participacaoRepository,
  conviteRepository,
  comunidadeRepository,
  avaliacaoRepository,
  usuarioRepository,
  eventos,
  relogio = () => new Date(),
}) {
  async function carregarAtividade(id) {
    const atividade = await atividadeRepository.buscarPorId(id);
    if (!atividade) throw new ErroNaoEncontrado('Atividade não encontrada');
    return atividade;
  }

  async function carregarComunidade(id) {
    const comunidade = await comunidadeRepository.buscarPorId(id);
    if (!comunidade) throw new ErroNaoEncontrado('Comunidade não encontrada');
    return comunidade;
  }

  function exigirConcluida(atividade) {
    if (atividade.status !== StatusAtividade.CONCLUIDA) {
      throw new ErroRegraNegocio('Só dá para avaliar depois que a atividade for concluída');
    }
  }

  const confirmado = (participacoes, usuarioId) => participacoes.some(
    (p) => mesmoId(p.usuarioId, usuarioId) && p.status === StatusParticipacao.ACEITO,
  );

  /** Acrescenta { autor: { id, nome } } (mesmo formato das outras listas da API). */
  async function comAutores(avaliacoes) {
    const nomes = await usuarioRepository.buscarResumos([...new Set(avaliacoes.map((a) => a.autorId))]);
    return avaliacoes.map((a) => ({ ...a, autor: nomes.get(Number(a.autorId)) || null }));
  }

  /** Grava, avisa (notificação) e devolve a avaliação com o nome do autor. */
  async function salvar(chave, dados, contexto) {
    const nova = criarAvaliacao({
      ...chave, dados, jaAvaliou: !!(await avaliacaoRepository.buscar(chave)), agora: relogio(),
    });
    const [salva] = await comAutores([await avaliacaoRepository.salvar(nova)]);
    await eventos.publicar(Eventos.AVALIACAO_CRIADA, { avaliacao: salva, ...contexto });
    return salva;
  }

  async function listagem(tipo, alvoId, usuario, extras) {
    const avaliacoes = await comAutores(await avaliacaoRepository.listarPorAlvo(tipo, alvoId));
    const minha = avaliacoes.find((a) => mesmoId(a.autorId, usuario.id));
    return {
      ...resumir(avaliacoes),
      avaliacoes: avaliacoes.map(({
        id, nota, comentario, criadaEm, autor,
      }) => ({
        id, nota, comentario, criadaEm, autor,
      })),
      minhaAvaliacao: minha ? { nota: minha.nota, comentario: minha.comentario } : null,
      ...extras,
    };
  }

  return {
    /** RF12/RF13 — participante confirmado avalia a atividade concluída: { nota, comentario? }. */
    async avaliarAtividade(atividadeId, dados, usuario) {
      const atividade = await carregarAtividade(atividadeId);
      exigirConcluida(atividade);
      const participacoes = await participacaoRepository.listarPorAtividade(atividade.id);
      if (!confirmado(participacoes, usuario.id)) {
        throw new ErroProibido('Só participantes confirmados podem avaliar a atividade');
      }
      return salvar(
        { autorId: usuario.id, tipo: TipoAvaliacao.ATIVIDADE, alvoId: atividade.id, contextoId: 0 },
        dados,
        { atividade },
      );
    },

    /** Média e lista. Quem pode ver a atividade pode ver as avaliações. */
    async listarDaAtividade(atividadeId, usuario) {
      const atividade = await carregarAtividade(atividadeId);
      const participacoes = await participacaoRepository.listarPorAtividade(atividade.id);
      if (atividade.visibilidade === Visibilidade.PRIVADA && !ehOrganizador(atividade, usuario)
        && !participacoes.some((p) => mesmoId(p.usuarioId, usuario.id))) {
        const convites = conviteRepository ? await conviteRepository.listarPorAtividade(atividade.id) : [];
        if (!podeVerPorConvite(convites, usuario)) throw new ErroNaoEncontrado('Atividade não encontrada');
      }
      return listagem(TipoAvaliacao.ATIVIDADE, atividade.id, usuario, {
        possoAvaliar: atividade.status === StatusAtividade.CONCLUIDA && confirmado(participacoes, usuario.id),
      });
    },

    /** RF14 — organizador avalia um participante confirmado: { nota, comentario? }. */
    async avaliarParticipante(atividadeId, participanteId, dados, usuario) {
      const atividade = await carregarAtividade(atividadeId);
      if (!ehOrganizador(atividade, usuario)) {
        throw new ErroProibido('Somente o organizador avalia os participantes');
      }
      exigirConcluida(atividade);
      const participacoes = await participacaoRepository.listarPorAtividade(atividade.id);
      if (!confirmado(participacoes, participanteId)) {
        throw new ErroRegraNegocio('Essa pessoa não foi participante confirmada desta atividade');
      }
      return salvar(
        {
          autorId: usuario.id, tipo: TipoAvaliacao.USUARIO, alvoId: Number(participanteId), contextoId: atividade.id,
        },
        dados,
        { atividade },
      );
    },

    /** RF18 — membro ativo (que não criou a comunidade) avalia depois de 3 meses dentro dela. */
    async avaliarComunidade(comunidadeId, dados, usuario) {
      const comunidade = await carregarComunidade(comunidadeId);
      if (mesmoId(comunidade.criadorId, usuario.id)) {
        throw new ErroRegraNegocio('Quem criou a comunidade não a avalia');
      }
      const membros = await comunidadeRepository.listarMembros(comunidade.id);
      if (!ehMembroAtivo(membros, usuario)) throw new ErroProibido('Só membros podem avaliar a comunidade');

      const liberadaEm = podeAvaliarComunidadeEm(membroDe(membros, usuario).entrouEm);
      if (relogio() < liberadaEm) {
        const data = liberadaEm.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        throw new ErroRegraNegocio(`Você poderá avaliar a partir de ${data} (3 meses na comunidade)`);
      }
      return salvar(
        { autorId: usuario.id, tipo: TipoAvaliacao.COMUNIDADE, alvoId: comunidade.id, contextoId: 0 },
        dados,
        { comunidade },
      );
    },

    /** Em comunidade privada, só membros veem as avaliações (igual à lista de membros). */
    async listarDaComunidade(comunidadeId, usuario) {
      const comunidade = await carregarComunidade(comunidadeId);
      const membros = await comunidadeRepository.listarMembros(comunidade.id);
      const souMembro = ehMembroAtivo(membros, usuario);
      if (comunidade.visibilidade === Visibilidade.PRIVADA && !souMembro) {
        throw new ErroProibido('Entre na comunidade para ver as avaliações');
      }
      const podeAvaliar = souMembro && !mesmoId(comunidade.criadorId, usuario.id);
      return listagem(TipoAvaliacao.COMUNIDADE, comunidade.id, usuario, {
        possoAvaliarEm: podeAvaliar ? podeAvaliarComunidadeEm(membroDe(membros, usuario).entrouEm) : null,
      });
    },

    /** Reputação de quem participa: média das notas dadas pelos organizadores (aparece no perfil). */
    async reputacao(usuarioId) {
      return resumir(await avaliacaoRepository.listarPorAlvo(TipoAvaliacao.USUARIO, usuarioId));
    },
  };
}

module.exports = { criarAvaliacaoService };
