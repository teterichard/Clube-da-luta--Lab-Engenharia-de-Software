const { criarAtividade } = require('../domain/atividade');
const { ErroNaoAutenticado } = require('../domain/erros');

/** Casos de uso de Atividade. Recebe o repositório por injeção de dependência. */
function criarAtividadeService({ atividadeRepository, relogio = () => new Date() }) {
  return {
    /** UC 5.2 — Criar Atividade (passos 2 e 3). */
    async criar(dados, organizador) {
      if (!organizador) throw new ErroNaoAutenticado();
      const atividade = criarAtividade(dados, organizador, relogio());
      return atividadeRepository.salvar(atividade);
    },
  };
}

module.exports = { criarAtividadeService };
