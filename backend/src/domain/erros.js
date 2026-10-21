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

module.exports = { ErroValidacao, ErroNaoAutenticado };
