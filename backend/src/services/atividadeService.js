const {
  criarAtividade,
  editarAtividade,
  mudarStatus,
  verificarExclusao,
} = require('../domain/atividade');
const { lerFiltros, aplicarFiltros } = require('../domain/filtros');
const { calcularVagas, ehOrganizador } = require('../domain/participacao');
const { podeVerPorConvite } = require('../domain/convite');
const { Visibilidade, StatusParticipacao } = require('../domain/enums');
const { ErroNaoAutenticado, ErroNaoEncontrado } = require('../domain/erros');
const { Eventos } = require('../domain/eventos');
const { idadePermite } = require('../domain/faixaEtaria');

/** Campos que, se mudarem, valem um aviso para quem vai participar. */
const CAMPOS_AVISADOS = ['dataHora', 'local', 'titulo'];

/** Casos de uso de Atividade. Recebe os repositórios por injeção de dependência. */
function criarAtividadeService({
  atividadeRepository,
  participacaoRepository,
  conviteRepository,
  usuarioRepository,
  eventos,
  relogio = () => new Date(),
}) {
  async function carregar(id) {
    const atividade = await atividadeRepository.buscarPorId(id);
    if (!atividade) throw new ErroNaoEncontrado('Atividade não encontrada');
    return atividade;
  }

  async function comVagas(atividade) {
    const participacoes = await participacaoRepository.listarPorAtividade(atividade.id);
    return { ...atividade, vagas: calcularVagas(atividade, participacoes) };
  }

  async function contarAceitos(atividadeId) {
    const participacoes = await participacaoRepository.listarPorAtividade(atividadeId);
    return participacoes.filter((p) => p.status === StatusParticipacao.ACEITO).length;
  }

  return {
    /** UC 5.2 — Criar Atividade (passos 2 e 3). */
    async criar(dados, organizador) {
      if (!organizador) throw new ErroNaoAutenticado();
      const atividade = criarAtividade(dados, organizador, relogio());
      const salva = await atividadeRepository.salvar(atividade);
      return { ...salva, vagas: salva.numeroIntegrantes };
    },

    /**
     * Inscrever-se em atividade — passos 2 a 4: listar e filtrar (CT-03, CT-07).
     * RF19: atividades cujo público não combina com a idade do usuário não aparecem.
     */
    async listar(query, usuario) {
      const filtros = lerFiltros(query);
      const perfil = usuario && usuarioRepository ? await usuarioRepository.buscarPorId(usuario.id) : null;
      const idade = perfil ? perfil.idade : null;
      const abertas = (await atividadeRepository.listarAbertas(relogio()))
        .filter((a) => ehOrganizador(a, usuario) || idadePermite(a.publicoAlvo, idade));
      const aceitas = await participacaoRepository.contarAceitas(abertas.map((a) => a.id));
      const comVagas = abertas.map((a) => ({
        ...a,
        vagas: Math.max(a.numeroIntegrantes - (aceitas.get(a.id) || 0), 0),
      }));
      return aplicarFiltros(comVagas, filtros);
    },

    /** Inscrever-se em atividade — passo 5: ver detalhes e vagas. */
    async detalhar(id, usuario) {
      const atividade = await atividadeRepository.buscarPorId(id);
      if (!atividade) throw new ErroNaoEncontrado('Atividade não encontrada');
      // atividade privada só aparece para o organizador e para quem foi convidado (RI04)
      if (atividade.visibilidade === Visibilidade.PRIVADA && !ehOrganizador(atividade, usuario)) {
        const convites = conviteRepository ? await conviteRepository.listarPorAtividade(atividade.id) : [];
        if (!podeVerPorConvite(convites, usuario)) throw new ErroNaoEncontrado('Atividade não encontrada');
      }
      return comVagas(atividade);
    },

    /** Atividades que o usuário organiza (todas), com vagas e quantas solicitações aguardam resposta. */
    async listarOrganizadas(usuario) {
      const atividades = await atividadeRepository.listarPorOrganizador(usuario.id);
      return Promise.all(atividades.map(async (a) => {
        const participacoes = await participacaoRepository.listarPorAtividade(a.id);
        return {
          ...a,
          vagas: calcularVagas(a, participacoes),
          pendentes: participacoes.filter((p) => p.status === StatusParticipacao.PENDENTE).length,
        };
      }));
    },

    /** RF04 — organizador edita a atividade enquanto ela está agendada. */
    async editar(id, dados, usuario) {
      const atual = await carregar(id);
      const editada = editarAtividade(atual, dados, usuario, await contarAceitos(atual.id), relogio());
      const salva = await atividadeRepository.atualizar(editada);
      const mudou = CAMPOS_AVISADOS.filter((c) => String(atual[c]) !== String(salva[c]));
      if (mudou.length > 0) {
        await eventos.publicar(Eventos.ATIVIDADE_EDITADA, {
          atividade: salva,
          campos: mudou,
          participacoes: await participacaoRepository.listarPorAtividade(salva.id),
        });
      }
      return comVagas(salva);
    },

    /** RF11 — iniciar, cancelar ou concluir. */
    async mudarStatus(id, acao, usuario) {
      const atual = await carregar(id);
      const alterada = mudarStatus(atual, usuario, acao, relogio());
      const salva = await atividadeRepository.atualizar(alterada);
      if (acao === 'cancelar' || acao === 'concluir') {
        // cancelada: avisa quem ia participar · concluída: convida os confirmados a avaliar (RF12)
        await eventos.publicar(acao === 'cancelar' ? Eventos.ATIVIDADE_CANCELADA : Eventos.ATIVIDADE_CONCLUIDA, {
          atividade: salva,
          participacoes: await participacaoRepository.listarPorAtividade(salva.id),
        });
      }
      return comVagas(salva);
    },

    /** RF04 — excluir (só sem participantes aceitos; com eles, o organizador cancela). */
    async excluir(id, usuario) {
      const atual = await carregar(id);
      verificarExclusao(atual, usuario, await contarAceitos(atual.id));
      await participacaoRepository.removerPorAtividade(atual.id);
      if (conviteRepository) await conviteRepository.removerPorAtividade(atual.id);
      await atividadeRepository.remover(atual.id);
    },
  };
}

module.exports = { criarAtividadeService };
