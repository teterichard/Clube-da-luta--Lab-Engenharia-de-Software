const { StatusAtividade, Visibilidade, Nivel } = require('./enums');
const { ErroValidacao } = require('./erros');

const MIN_INTEGRANTES = 2; // RN05 — "pelo menos dois times" (pendência P1 do plano)

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

/**
 * Valida os dados de entrada e monta uma nova Atividade (UC 5.2 — Criar Atividade).
 * Regras RN01–RN09 do plano de ação. Lança ErroValidacao com todos os problemas encontrados.
 *
 * @param {object} dados corpo recebido do cliente
 * @param {{ id: number|string }} organizador usuário autenticado
 * @param {Date} agora injetável para facilitar testes
 */
function criarAtividade(dados, organizador, agora = new Date()) {
  const erros = [];
  const d = dados || {};

  if (!organizador || organizador.id == null) {
    erros.push({ campo: 'organizador', mensagem: 'Organizador é obrigatório' });
  }

  // RN01
  const titulo = texto(d.titulo);
  if (titulo.length < 3 || titulo.length > 100) {
    erros.push({ campo: 'titulo', mensagem: 'Título é obrigatório e deve ter entre 3 e 100 caracteres' });
  }

  // RN09
  const descricao = texto(d.descricao);
  if (descricao.length > 500) {
    erros.push({ campo: 'descricao', mensagem: 'Descrição deve ter no máximo 500 caracteres' });
  }

  // RN02
  const tipo = texto(d.tipo).toLowerCase();
  if (!tipo) erros.push({ campo: 'tipo', mensagem: 'Tipo de atividade é obrigatório' });

  const publicoAlvo = texto(d.publicoAlvo).toLowerCase();
  if (!publicoAlvo) erros.push({ campo: 'publicoAlvo', mensagem: 'Público-alvo é obrigatório' });

  const local = texto(d.local);
  if (!local) erros.push({ campo: 'local', mensagem: 'Local é obrigatório' });

  // RN03
  const nivel = texto(d.nivel).toLowerCase();
  if (!Object.values(Nivel).includes(nivel)) {
    erros.push({ campo: 'nivel', mensagem: `Nível deve ser um de: ${Object.values(Nivel).join(', ')}` });
  }

  // RN04
  const dataHora = typeof d.dataHora === 'string' ? new Date(d.dataHora) : null;
  if (!dataHora || Number.isNaN(dataHora.getTime())) {
    erros.push({ campo: 'dataHora', mensagem: 'Data e horário são obrigatórios (formato ISO-8601)' });
  } else if (dataHora <= agora) {
    erros.push({ campo: 'dataHora', mensagem: 'Data e horário devem ser no futuro' });
  }

  // RN05
  const numeroIntegrantes = d.numeroIntegrantes;
  if (!Number.isInteger(numeroIntegrantes) || numeroIntegrantes < MIN_INTEGRANTES) {
    erros.push({
      campo: 'numeroIntegrantes',
      mensagem: `Número de integrantes deve ser um inteiro maior ou igual a ${MIN_INTEGRANTES}`,
    });
  }

  // RN06
  const visibilidade = d.visibilidade == null ? Visibilidade.PUBLICA : texto(d.visibilidade).toUpperCase();
  if (!Object.values(Visibilidade).includes(visibilidade)) {
    erros.push({ campo: 'visibilidade', mensagem: 'Visibilidade deve ser PUBLICA ou PRIVADA' });
  }

  if (erros.length > 0) {
    throw new ErroValidacao(erros);
  }

  // RN07 e RN08: status e organizador nunca vêm do cliente
  return {
    titulo,
    descricao: descricao || null,
    tipo,
    nivel,
    publicoAlvo,
    dataHora,
    local,
    numeroIntegrantes,
    visibilidade,
    status: StatusAtividade.AGENDADA,
    organizadorId: organizador.id,
    criadaEm: agora,
  };
}

module.exports = { criarAtividade, MIN_INTEGRANTES };
