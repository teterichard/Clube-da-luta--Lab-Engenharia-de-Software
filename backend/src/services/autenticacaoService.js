const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  validarCadastro,
  validarLogin,
  validarAtualizacaoPerfil,
  semSenha,
} = require('../domain/usuario');
const { ErroNaoAutenticado, ErroNaoEncontrado, ErroRegraNegocio } = require('../domain/erros');

const CUSTO_BCRYPT = 10;

/**
 * UC Autenticação — RF01 (cadastro), RF02 (login) e perfil do usuário logado.
 * Senhas guardadas só como hash bcrypt (RNF04). O token JWT leva `sub` (id) e `nome`.
 */
function criarAutenticacaoService({
  usuarioRepository,
  jwtSegredo,
  jwtExpiracao = '7d',
  relogio = () => new Date(),
  custoBcrypt = CUSTO_BCRYPT,
}) {
  function emitirToken(usuario) {
    return jwt.sign({ sub: usuario.id, nome: usuario.nome }, jwtSegredo, { expiresIn: jwtExpiracao });
  }

  return {
    async cadastrar(dados) {
      const novo = validarCadastro(dados);
      if (await usuarioRepository.buscarPorEmail(novo.email)) {
        throw new ErroRegraNegocio('Já existe uma conta com este e-mail');
      }
      const senhaHash = await bcrypt.hash(dados.senha, custoBcrypt);
      const salvo = await usuarioRepository.salvar({ ...novo, senhaHash, criadoEm: relogio() });
      return { token: emitirToken(salvo), usuario: semSenha(salvo) };
    },

    async login(dados) {
      const { email, senha } = validarLogin(dados);
      const usuario = await usuarioRepository.buscarPorEmail(email);
      // mesma mensagem para e-mail inexistente e senha errada (não revela quem tem conta)
      const senhaConfere = usuario ? await bcrypt.compare(senha, usuario.senhaHash) : false;
      if (!senhaConfere) throw new ErroNaoAutenticado('E-mail ou senha incorretos');
      return { token: emitirToken(usuario), usuario: semSenha(usuario) };
    },

    async perfil(usuarioLogado) {
      const usuario = await usuarioRepository.buscarPorId(usuarioLogado.id);
      if (!usuario) throw new ErroNaoEncontrado('Usuário não encontrado');
      return semSenha(usuario);
    },

    async atualizarPerfil(usuarioLogado, dados) {
      const alteracoes = validarAtualizacaoPerfil(dados);
      const atualizado = await usuarioRepository.atualizar(usuarioLogado.id, alteracoes);
      if (!atualizado) throw new ErroNaoEncontrado('Usuário não encontrado');
      return semSenha(atualizado);
    },
  };
}

module.exports = { criarAutenticacaoService };
