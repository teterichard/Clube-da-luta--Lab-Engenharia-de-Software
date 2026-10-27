const jwt = require('jsonwebtoken');
const { ErroNaoAutenticado } = require('../domain/erros');

/** Valida o JWT do header Authorization e popula req.usuario = { id, nome }. */
function autenticacao(segredo) {
  return (req, _res, next) => {
    const [tipo, token] = (req.headers.authorization || '').split(' ');
    if (tipo !== 'Bearer' || !token) {
      return next(new ErroNaoAutenticado());
    }
    try {
      const payload = jwt.verify(token, segredo);
      req.usuario = { id: payload.sub, nome: payload.nome };
      return next();
    } catch {
      return next(new ErroNaoAutenticado('Token inválido ou expirado'));
    }
  };
}

module.exports = { autenticacao };
