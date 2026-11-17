/**
 * CORS para o front hospedado em outro domínio (ex.: Vercel → API no Railway).
 * CORS_ORIGIN = lista separada por vírgula (ex.: "https://topa-ai.vercel.app") ou "*".
 * Sem CORS_ORIGIN nada é liberado: no desenvolvimento o Vite já faz o proxy de /api.
 */
function cors(origensPermitidas) {
  const lista = (origensPermitidas || '').split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean);

  return (req, res, next) => {
    const origem = req.headers.origin;
    const liberada = !!origem && (lista.includes('*') || lista.includes(origem));
    if (liberada) {
      res.setHeader('Access-Control-Allow-Origin', lista.includes('*') ? '*' : origem);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Max-Age', '600');
    }
    if (req.method === 'OPTIONS' && origem) {
      res.statusCode = liberada ? 204 : 403;
      return res.end();
    }
    return next();
  };
}

module.exports = { cors };
