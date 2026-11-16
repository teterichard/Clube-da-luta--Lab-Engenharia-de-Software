const { Visibilidade, PapelMembro, StatusMembro } = require('./enums');
const {
  ErroValidacao,
  ErroProibido,
  ErroRegraNegocio,
  ErroNaoEncontrado,
} = require('./erros');
const { Decisao } = require('./participacao');

/**
 * Comunidades — grupos de pessoas com interesses em comum (wiki 2.3: "seguir comunidades de interesse").
 * Portado da classe Java Comunidade: nome, descrição e visibilidade obrigatórios; públicas permitem
 * entrada direta, privadas exigem aprovação de um administrador.
 */

const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const mesmoId = (a, b) => a != null && b != null && String(a) === String(b);

function validarCampos(d, erros) {
  const nome = texto(d.nome);
  if (nome.length < 3 || nome.length > 80) {
    erros.push({ campo: 'nome', mensagem: 'Nome é obrigatório e deve ter entre 3 e 80 caracteres' });
  }
  const descricao = texto(d.descricao);
  if (!descricao || descricao.length > 500) {
    erros.push({ campo: 'descricao', mensagem: 'Descrição é obrigatória e deve ter no máximo 500 caracteres' });
  }
  const visibilidade = d.visibilidade == null ? Visibilidade.PUBLICA : texto(d.visibilidade).toUpperCase();
  if (!Object.values(Visibilidade).includes(visibilidade)) {
    erros.push({ campo: 'visibilidade', mensagem: 'Visibilidade deve ser PUBLICA ou PRIVADA' });
  }
  return { nome, descricao, visibilidade };
}

/** RCo01 — cria a comunidade; quem cria vira o primeiro administrador. */
function criarComunidade(dados, criador, agora = new Date()) {
  const erros = [];
  const campos = validarCampos(dados || {}, erros);
  if (erros.length > 0) throw new ErroValidacao(erros);
  return { ...campos, criadorId: criador.id, criadaEm: agora };
}

function membroDe(membros, usuario) {
  return usuario ? membros.find((m) => mesmoId(m.usuarioId, usuario.id)) : undefined;
}

function ehAdmin(membros, usuario) {
  const m = membroDe(membros, usuario);
  return !!m && m.status === StatusMembro.ATIVO && m.papel === PapelMembro.ADMIN;
}

function ehMembroAtivo(membros, usuario) {
  const m = membroDe(membros, usuario);
  return !!m && m.status === StatusMembro.ATIVO;
}

/** RCo02 — só administradores editam (campos não enviados ficam como estão). */
function editarComunidade(atual, alteracoes, membros, usuario) {
  if (!ehAdmin(membros, usuario)) throw new ErroProibido('Somente administradores podem editar a comunidade');
  const a = alteracoes || {};
  const mesclado = {};
  ['nome', 'descricao', 'visibilidade'].forEach((c) => { mesclado[c] = a[c] !== undefined ? a[c] : atual[c]; });
  const erros = [];
  const campos = validarCampos(mesclado, erros);
  if (erros.length > 0) throw new ErroValidacao(erros);
  return { ...atual, ...campos };
}

/** RCo03 — entrar: pública → ATIVO na hora; privada → PENDENTE até um admin aprovar. Sem duplicidade. */
function entrar(comunidade, membros, usuario, agora = new Date()) {
  const existente = membroDe(membros, usuario);
  if (existente) {
    throw new ErroRegraNegocio(existente.status === StatusMembro.PENDENTE
      ? 'Seu pedido para entrar já está aguardando aprovação'
      : 'Você já faz parte desta comunidade');
  }
  const publica = comunidade.visibilidade === Visibilidade.PUBLICA;
  return {
    comunidadeId: comunidade.id,
    usuarioId: usuario.id,
    papel: PapelMembro.MEMBRO,
    status: publica ? StatusMembro.ATIVO : StatusMembro.PENDENTE,
    entrouEm: agora,
  };
}

/** RCo04 — sair (ou desistir do pedido). O último administrador não pode sair e deixar a comunidade sem dono. */
function sair(membros, usuario) {
  const membro = membroDe(membros, usuario);
  if (!membro) throw new ErroNaoEncontrado('Você não faz parte desta comunidade');
  if (ehAdmin(membros, usuario)) {
    const admins = membros.filter((m) => m.papel === PapelMembro.ADMIN && m.status === StatusMembro.ATIVO);
    if (admins.length === 1) {
      throw new ErroRegraNegocio('Você é o único administrador: promova outra pessoa antes de sair');
    }
  }
  return membro;
}

/** RCo05 — admin aprova ou recusa um pedido pendente. Recusar remove o pedido (a pessoa pode pedir de novo). */
function responderPedido(membros, usuario, alvoId, decisao) {
  const d = typeof decisao === 'string' ? decisao.trim().toUpperCase() : '';
  if (!Object.values(Decisao).includes(d)) {
    throw new ErroValidacao([{ campo: 'decisao', mensagem: 'Decisão deve ser ACEITAR ou RECUSAR' }]);
  }
  if (!ehAdmin(membros, usuario)) throw new ErroProibido('Somente administradores respondem pedidos');
  const alvo = membros.find((m) => mesmoId(m.usuarioId, alvoId));
  if (!alvo) throw new ErroNaoEncontrado('Pedido não encontrado');
  if (alvo.status !== StatusMembro.PENDENTE) throw new ErroRegraNegocio('Este pedido já foi respondido');
  return d === Decisao.ACEITAR ? { ...alvo, status: StatusMembro.ATIVO } : null;
}

/** RCo06 — admin promove um membro ativo a administrador. */
function promover(membros, usuario, alvoId) {
  if (!ehAdmin(membros, usuario)) throw new ErroProibido('Somente administradores promovem membros');
  const alvo = membros.find((m) => mesmoId(m.usuarioId, alvoId));
  if (!alvo || alvo.status !== StatusMembro.ATIVO) throw new ErroNaoEncontrado('Membro não encontrado');
  if (alvo.papel === PapelMembro.ADMIN) throw new ErroRegraNegocio('Esta pessoa já é administradora');
  return { ...alvo, papel: PapelMembro.ADMIN };
}

/** Em comunidade privada, a lista de membros é só para quem está dentro. Pedidos pendentes, só admins veem. */
function membrosVisiveis(comunidade, membros, usuario) {
  if (comunidade.visibilidade === Visibilidade.PRIVADA && !ehMembroAtivo(membros, usuario)) {
    throw new ErroProibido('Entre na comunidade para ver os membros');
  }
  return ehAdmin(membros, usuario) ? membros : membros.filter((m) => m.status === StatusMembro.ATIVO);
}

module.exports = {
  criarComunidade,
  editarComunidade,
  entrar,
  sair,
  responderPedido,
  promover,
  membrosVisiveis,
  membroDe,
  ehAdmin,
};
