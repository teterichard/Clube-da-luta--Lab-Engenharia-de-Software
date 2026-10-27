const { Nivel } = require('./enums');
const { ErroValidacao } = require('./erros');

/**
 * Filtros da lista de atividades (fluxo básico passo 3, CT-03 e CT-07).
 * Padrão Strategy (wiki): cada filtro é uma estratégia independente { aplica, atende };
 * a lista final é a interseção de todas as estratégias ativas.
 */

const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const normalizar = (v) => texto(v).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const estrategias = [
  {
    nome: 'tipo',
    atende: (a, f) => normalizar(a.tipo) === normalizar(f.tipo),
  },
  {
    nome: 'nivel',
    atende: (a, f) => a.nivel === f.nivel,
  },
  {
    nome: 'publicoAlvo',
    atende: (a, f) => normalizar(a.publicoAlvo) === normalizar(f.publicoAlvo),
  },
  {
    nome: 'local',
    // busca parcial: "ibirapuera" encontra "Parque Ibirapuera - quadra 3"
    atende: (a, f) => normalizar(a.local).includes(normalizar(f.local)),
  },
  {
    nome: 'data',
    // mesmo dia (AAAA-MM-DD), no fuso de Brasília
    atende: (a, f) => diaEmBrasilia(a.dataHora) === f.data,
  },
  {
    nome: 'comVaga',
    atende: (a) => a.vagas > 0,
  },
];

function diaEmBrasilia(dataHora) {
  return new Date(dataHora).toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
}

/** Lê os filtros da query string, valida e devolve um objeto só com os filtros informados. */
function lerFiltros(query = {}) {
  const filtros = {};
  const erros = [];

  ['tipo', 'publicoAlvo', 'local'].forEach((campo) => {
    if (texto(query[campo])) filtros[campo] = texto(query[campo]);
  });

  if (texto(query.nivel)) {
    const nivel = normalizar(query.nivel);
    if (!Object.values(Nivel).includes(nivel)) {
      erros.push({ campo: 'nivel', mensagem: `Nível deve ser um de: ${Object.values(Nivel).join(', ')}` });
    } else {
      filtros.nivel = nivel;
    }
  }

  if (texto(query.data)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(texto(query.data))) {
      erros.push({ campo: 'data', mensagem: 'Data deve estar no formato AAAA-MM-DD' });
    } else {
      filtros.data = texto(query.data);
    }
  }

  if (query.comVaga === 'true') filtros.comVaga = true;

  if (erros.length > 0) throw new ErroValidacao(erros);
  return filtros;
}

/** Aplica todas as estratégias ativas. `atividades` já devem trazer o campo `vagas`. */
function aplicarFiltros(atividades, filtros) {
  const ativas = estrategias.filter((e) => filtros[e.nome] !== undefined);
  return atividades.filter((a) => ativas.every((e) => e.atende(a, filtros)));
}

module.exports = { lerFiltros, aplicarFiltros };
