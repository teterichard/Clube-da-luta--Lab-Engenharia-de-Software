const { StatusAtividade, Visibilidade, Nivel } = require('./enums');
const { ErroValidacao, ErroProibido, ErroRegraNegocio } = require('./erros');

const MIN_INTEGRANTES = 2; // RN05 — "pelo menos dois times" (pendência P1 do plano)

/** Campos que o organizador pode informar ao criar e alterar ao editar (RF03/RF04). */
const CAMPOS_EDITAVEIS = [
  'titulo', 'descricao', 'tipo', 'nivel', 'publicoAlvo',
  'dataHora', 'local', 'numeroIntegrantes', 'visibilidade',
];

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

const mesmoId = (a, b) => a != null && b != null && String(a) === String(b);

/**
 * Valida os dados de uma atividade (RN01–RN06, RN09) e devolve os campos normalizados.
 * `exigirFuturo` = false permite editar outros campos sem mexer numa data já definida.
 */
function validarDados(d, agora, { exigirFuturo = true } = {}) {
  const erros = [];

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
  let dataHora = null;
  if (d.dataHora instanceof Date) dataHora = d.dataHora;
  else if (typeof d.dataHora === 'string') dataHora = new Date(d.dataHora);
  if (!dataHora || Number.isNaN(dataHora.getTime())) {
    erros.push({ campo: 'dataHora', mensagem: 'Data e horário são obrigatórios (formato ISO-8601)' });
  } else if (exigirFuturo && dataHora <= agora) {
    erros.push({ campo: 'dataHora', mensagem: 'Data e horário devem ser no futuro' });
  }

  // RN05
  const { numeroIntegrantes } = d;
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

  return {
    erros,
    dados: {
      titulo,
      descricao: descricao || null,
      tipo,
      nivel,
      publicoAlvo,
      dataHora,
      local,
      numeroIntegrantes,
      visibilidade,
    },
  };
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
  const { erros, dados: validos } = validarDados(dados || {}, agora);

  if (!organizador || organizador.id == null) {
    erros.unshift({ campo: 'organizador', mensagem: 'Organizador é obrigatório' });
  }
  if (erros.length > 0) {
    throw new ErroValidacao(erros);
  }

  // RN07 e RN08: status e organizador nunca vêm do cliente
  return {
    ...validos,
    status: StatusAtividade.AGENDADA,
    organizadorId: organizador.id,
    criadaEm: agora,
  };
}

function ehOrganizador(atividade, usuario) {
  return !!usuario && mesmoId(atividade.organizadorId, usuario.id);
}

function exigirOrganizador(atividade, usuario, acao) {
  if (!ehOrganizador(atividade, usuario)) {
    throw new ErroProibido(`Somente o organizador pode ${acao}`);
  }
}

/**
 * RF04 — editar atividade. Só o organizador, só enquanto AGENDADA.
 * Campos não enviados ficam como estão; o número de integrantes não pode ficar
 * abaixo de quem já foi aceito (RE03).
 */
function editarAtividade(atual, alteracoes, usuario, aceitos, agora = new Date()) {
  exigirOrganizador(atual, usuario, 'editar a atividade');
  if (atual.status !== StatusAtividade.AGENDADA) {
    throw new ErroRegraNegocio('Só é possível editar uma atividade agendada');
  }

  const a = alteracoes || {};
  const mesclado = {};
  CAMPOS_EDITAVEIS.forEach((campo) => {
    mesclado[campo] = a[campo] !== undefined ? a[campo] : atual[campo];
  });

  const { erros, dados } = validarDados(mesclado, agora, { exigirFuturo: a.dataHora !== undefined });
  if (Number.isInteger(dados.numeroIntegrantes) && dados.numeroIntegrantes < aceitos) {
    erros.push({
      campo: 'numeroIntegrantes',
      mensagem: `Já existem ${aceitos} participantes aceitos; o número de integrantes não pode ser menor`,
    });
  }
  if (erros.length > 0) throw new ErroValidacao(erros);

  return { ...atual, ...dados, atualizadaEm: agora };
}

/**
 * RF11 — ciclo de status (mesmas regras da classe Java Atividade):
 * iniciar: AGENDADA → ATIVA · concluir: ATIVA → CONCLUIDA
 * cancelar: AGENDADA ou ATIVA → CANCELADA
 */
const TRANSICOES = Object.freeze({
  iniciar: { de: [StatusAtividade.AGENDADA], para: StatusAtividade.ATIVA, erro: 'Só é possível iniciar uma atividade agendada' },
  concluir: { de: [StatusAtividade.ATIVA], para: StatusAtividade.CONCLUIDA, erro: 'Só é possível concluir uma atividade ativa' },
  cancelar: {
    de: [StatusAtividade.AGENDADA, StatusAtividade.ATIVA],
    para: StatusAtividade.CANCELADA,
    erro: 'Atividade concluída ou já cancelada não pode ser cancelada',
  },
});

function mudarStatus(atividade, usuario, acao, agora = new Date()) {
  const transicao = TRANSICOES[acao];
  if (!transicao) {
    throw new ErroValidacao([{ campo: 'acao', mensagem: `Ação deve ser uma de: ${Object.keys(TRANSICOES).join(', ')}` }]);
  }
  exigirOrganizador(atividade, usuario, 'alterar o status da atividade');
  if (!transicao.de.includes(atividade.status)) {
    throw new ErroRegraNegocio(transicao.erro);
  }
  return { ...atividade, status: transicao.para, atualizadaEm: agora };
}

/** RE05 — excluir só se ninguém foi aceito; com participantes confirmados, o caminho é cancelar. */
function verificarExclusao(atividade, usuario, aceitos) {
  exigirOrganizador(atividade, usuario, 'excluir a atividade');
  if (aceitos > 0) {
    throw new ErroRegraNegocio('A atividade já tem participantes confirmados: cancele em vez de excluir');
  }
}

module.exports = {
  criarAtividade,
  editarAtividade,
  mudarStatus,
  verificarExclusao,
  ehOrganizador,
  TRANSICOES,
  MIN_INTEGRANTES,
};
