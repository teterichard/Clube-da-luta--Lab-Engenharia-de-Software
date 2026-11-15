const {
  criarAtividade,
  editarAtividade,
  mudarStatus,
  verificarExclusao,
} = require('../domain/atividade');
const { lerFiltros, aplicarFiltros } = require('../domain/filtros');
const { calcularVagas, ehOrganizador } = require('../domain/participacao');
const { Visibilidade, StatusParticipacao } = require('../domain/enums');
const { ErroNaoAutenticado, ErroNaoEncontrado } = require('../domain/erros');

/** Casos de uso de Atividade. Recebe os repositórios por injeção de dependência. */
function criarAtividadeService({ atividadeRepository, participacaoRepository, relogio = () => new Date() }) {
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

    /** Inscrever-se em atividade — passos 2 a 4: listar e filtrar (CT-03, CT-07). */
    async listar(query) {
      const filtros = lerFiltros(query);
      const abertas = await atividadeRepository.listarAbertas(relogio());
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
      // atividade privada não aparece para quem não é o organizador
      if (!atividade
        || (atividade.visibilidade === Visibilidade.PRIVADA && !ehOrganizador(atividade, usuario))) {
        throw new ErroNaoEncontrado('Atividade não encontrada');
      }
      return comVagas(atividade);
    },

    /** RF04 — organizador edita a atividade enquanto ela está agendada. */
    async editar(id, dados, usuario) {
      const atual = await carregar(id);
      const editada = editarAtividade(atual, dados, usuario, await contarAceitos(atual.id), relogio());
      return comVagas(await atividadeRepository.atualizar(editada));
    },

    /** RF11 — iniciar, cancelar ou concluir. */
    async mudarStatus(id, acao, usuario) {
      const atual = await carregar(id);
      const alterada = mudarStatus(atual, usuario, acao, relogio());
      return comVagas(await atividadeRepository.atualizar(alterada));
    },

    /** RF04 — excluir (só sem participantes aceitos; com eles, o organizador cancela). */
    async excluir(id, usuario) {
      const atual = await carregar(id);
      verificarExclusao(atual, usuario, await contarAceitos(atual.id));
      await participacaoRepository.removerPorAtividade(atual.id);
      await atividadeRepository.remover(atual.id);
    },
  };
}

module.exports = { criarAtividadeService };
