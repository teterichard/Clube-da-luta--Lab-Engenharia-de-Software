const { Nivel } = require('./enums');
const { ErroValidacao } = require('./erros');

/**
 * Regras do UC Autenticação (RF01 cadastro / RF02 login) e do perfil do usuário.
 * Funções puras: a criptografia da senha (bcrypt — RNF04) fica no serviço.
 */

const MIN_SENHA = 8;
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const texto = (v) => (typeof v === 'string' ? v.trim() : '');

function normalizarEmail(email) {
  return texto(email).toLowerCase();
}

/** Campos opcionais do perfil (colunas localizacao, idade e proficiencia da tabela usuario). */
function validarPerfil(d, erros) {
  const perfil = {};

  if (d.localizacao !== undefined) {
    const localizacao = texto(d.localizacao);
    if (localizacao.length > 150) {
      erros.push({ campo: 'localizacao', mensagem: 'Localização deve ter no máximo 150 caracteres' });
    }
    perfil.localizacao = localizacao || null;
  }

  if (d.idade !== undefined && d.idade !== null && d.idade !== '') {
    if (!Number.isInteger(d.idade) || d.idade < 13 || d.idade > 120) {
      erros.push({ campo: 'idade', mensagem: 'Idade deve ser um número inteiro entre 13 e 120' });
    }
    perfil.idade = d.idade;
  } else if (d.idade !== undefined) {
    perfil.idade = null;
  }

  if (d.proficiencia !== undefined && d.proficiencia !== null && d.proficiencia !== '') {
    const proficiencia = texto(d.proficiencia).toLowerCase();
    if (!Object.values(Nivel).includes(proficiencia)) {
      erros.push({
        campo: 'proficiencia',
        mensagem: `Proficiência deve ser uma de: ${Object.values(Nivel).join(', ')}`,
      });
    }
    perfil.proficiencia = proficiencia;
  } else if (d.proficiencia !== undefined) {
    perfil.proficiencia = null;
  }

  return perfil;
}

/** RF01 — valida os dados de cadastro. Devolve o usuário sem a senha (o serviço gera o hash). */
function validarCadastro(dados) {
  const d = dados || {};
  const erros = [];

  const nome = texto(d.nome);
  if (nome.length < 2 || nome.length > 100) {
    erros.push({ campo: 'nome', mensagem: 'Nome é obrigatório e deve ter entre 2 e 100 caracteres' });
  }

  const email = normalizarEmail(d.email);
  if (!EMAIL_VALIDO.test(email) || email.length > 150) {
    erros.push({ campo: 'email', mensagem: 'E-mail inválido' });
  }

  if (typeof d.senha !== 'string' || d.senha.length < MIN_SENHA || d.senha.length > 72) {
    erros.push({ campo: 'senha', mensagem: `Senha deve ter entre ${MIN_SENHA} e 72 caracteres` });
  }

  const perfil = validarPerfil(d, erros);

  if (erros.length > 0) throw new ErroValidacao(erros);
  return { nome, email, ...perfil };
}

/** RF02 — só confere se os campos vieram; a checagem da senha é feita no serviço. */
function validarLogin(dados) {
  const d = dados || {};
  const erros = [];
  const email = normalizarEmail(d.email);
  if (!email) erros.push({ campo: 'email', mensagem: 'E-mail é obrigatório' });
  if (typeof d.senha !== 'string' || !d.senha) erros.push({ campo: 'senha', mensagem: 'Senha é obrigatória' });
  if (erros.length > 0) throw new ErroValidacao(erros);
  return { email, senha: d.senha };
}

/** Edição do próprio perfil: nome e campos opcionais. E-mail e senha não mudam por aqui. */
function validarAtualizacaoPerfil(dados) {
  const d = dados || {};
  const erros = [];
  const alteracoes = {};

  if (d.nome !== undefined) {
    const nome = texto(d.nome);
    if (nome.length < 2 || nome.length > 100) {
      erros.push({ campo: 'nome', mensagem: 'Nome deve ter entre 2 e 100 caracteres' });
    }
    alteracoes.nome = nome;
  }
  Object.assign(alteracoes, validarPerfil(d, erros));

  if (erros.length > 0) throw new ErroValidacao(erros);
  return alteracoes;
}

/** Nunca devolve o hash da senha para fora do serviço. */
function semSenha(usuario) {
  if (!usuario) return null;
  const { senhaHash, ...publico } = usuario; // eslint-disable-line no-unused-vars
  return publico;
}

module.exports = {
  validarCadastro,
  validarLogin,
  validarAtualizacaoPerfil,
  normalizarEmail,
  semSenha,
  MIN_SENHA,
};
