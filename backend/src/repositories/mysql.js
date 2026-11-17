const { criarAtividadeRepositoryMySQL } = require('./atividadeRepositoryMySQL');
const { criarParticipacaoRepositoryMySQL } = require('./participacaoRepositoryMySQL');
const { criarUsuarioRepositoryMySQL } = require('./usuarioRepositoryMySQL');
const { criarConviteRepositoryMySQL } = require('./conviteRepositoryMySQL');
const { criarNotificacaoRepositoryMySQL } = require('./notificacaoRepositoryMySQL');
const { criarComunidadeRepositoryMySQL } = require('./comunidadeRepositoryMySQL');
const { criarAvaliacaoRepositoryMySQL } = require('./avaliacaoRepositoryMySQL');
const { criarTravaMySQL } = require('./travaMySQL');

/** Monta todos os repositórios MySQL sobre um pool do mysql2/promise. */
function criarRepositoriosMySQL(pool) {
  return {
    atividadeRepository: criarAtividadeRepositoryMySQL(pool),
    participacaoRepository: criarParticipacaoRepositoryMySQL(pool),
    usuarioRepository: criarUsuarioRepositoryMySQL(pool),
    conviteRepository: criarConviteRepositoryMySQL(pool),
    notificacaoRepository: criarNotificacaoRepositoryMySQL(pool),
    comunidadeRepository: criarComunidadeRepositoryMySQL(pool),
    avaliacaoRepository: criarAvaliacaoRepositoryMySQL(pool),
    comTrava: criarTravaMySQL(pool),
  };
}

module.exports = { criarRepositoriosMySQL };
