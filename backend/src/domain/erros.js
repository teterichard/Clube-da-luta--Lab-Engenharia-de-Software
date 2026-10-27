class ErroValidacao extends Error {
  constructor(detalhes) {
    super('Dados inválidos');
    this.name = 'ErroValidacao';
    this.status = 400;
    this.detalhes = detalhes; // [{ campo, mensagem }]
  }
}

class ErroNaoAutenticado extends Error {
  constructor(mensagem = 'Necessário estar logado') {
    super(mensagem);
    this.name = 'ErroNaoAutenticado';
    this.status = 401;
  }
}

/** Usuário autenticado, mas sem permissão para a ação (ex.: não é o organizador). */
class ErroProibido extends Error {
  constructor(mensagem = 'Ação não permitida') {
    super(mensagem);
    this.name = 'ErroProibido';
    this.status = 403;
  }
}

class ErroNaoEncontrado extends Error {
  constructor(mensagem = 'Recurso não encontrado') {
    super(mensagem);
    this.name = 'ErroNaoEncontrado';
    this.status = 404;
  }
}

/** Regra de negócio violada pelo estado atual (sem vagas, duplicidade, etc.). */
class ErroRegraNegocio extends Error {
  constructor(mensagem) {
    super(mensagem);
    this.name = 'ErroRegraNegocio';
    this.status = 409;
  }
}

module.exports = {
  ErroValidacao,
  ErroNaoAutenticado,
  ErroProibido,
  ErroNaoEncontrado,
  ErroRegraNegocio,
};
