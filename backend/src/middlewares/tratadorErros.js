/* eslint-disable no-unused-vars */
function tratadorErros(err, _req, res, _next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido' });
  }
  if (err.status && err.status < 500) {
    const corpo = { erro: err.message };
    if (err.detalhes) corpo.detalhes = err.detalhes;
    return res.status(err.status).json(corpo);
  }
  console.error(err);
  return res.status(500).json({ erro: 'Erro interno do servidor' });
}

module.exports = { tratadorErros };
