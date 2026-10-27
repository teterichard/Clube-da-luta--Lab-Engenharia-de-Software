const { criarAtividade } = require('../domain/atividade');
const { lerFiltros, aplicarFiltros } = require('../domain/filtros');
const { calcularVagas, ehOrganizador } = require('../domain/participacao');
const { Visibilidade } = require('../domain/enums');
const { ErroNaoAutenticado, ErroNaoEncontrado } = require('../domain/erros');

/** Casos de uso de Atividade. Recebe os repositórios por injeção de dependência. */
function criarAtividadeService({ atividadeRepository, participacaoRepository, relogio = () => new Date() }) {
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
      const participacoes = await participacaoRepository.listarPorAtividade(atividade.id);
      return { ...atividade, vagas: calcularVagas(atividade, participacoes) };
    },
  };
}

module.exports = { criarAtividadeService };
