const { criarConvite, responderConvite } = require('../domain/convite');
const { ehOrganizador } = require('../domain/atividade');
const { normalizarEmail } = require('../domain/usuario');
const { StatusConvite, StatusParticipacao } = require('../domain/enums');
const { ErroNaoEncontrado, ErroProibido, ErroValidacao } = require('../domain/erros');

const mesmoId = (a, b) => String(a) === String(b);

/** RF07 — convidar pessoas específicas, listar e responder convites. */
function criarConviteService({
  atividadeRepository,
  participacaoRepository,
  usuarioRepository,
  conviteRepository,
  comTrava,
  relogio = () => new Date(),
}) {
  async function carregarAtividade(id) {
    const atividade = await atividadeRepository.buscarPorId(id);
    if (!atividade) throw new ErroNaoEncontrado('Atividade não encontrada');
    return atividade;
  }

  /** Acrescenta { convidado: { id, nome } } para a tela mostrar nomes. */
  async function comConvidados(convites) {
    const resumos = await usuarioRepository.buscarResumos([...new Set(convites.map((c) => c.convidadoId))]);
    return convites.map((c) => ({ ...c, convidado: resumos.get(Number(c.convidadoId)) || null }));
  }

  /** Ao aceitar o convite a presença fica confirmada (participação ACEITO). */
  async function confirmarPresenca(participacaoRepositorio, atividade, participacoes, usuarioId, agora) {
    const pendente = participacoes.find(
      (p) => mesmoId(p.usuarioId, usuarioId) && p.status === StatusParticipacao.PENDENTE,
    );
    if (pendente) {
      return participacaoRepositorio.atualizar({ ...pendente, status: StatusParticipacao.ACEITO, respondidaEm: agora });
    }
    return participacaoRepositorio.salvar({
      atividadeId: atividade.id,
      usuarioId,
      status: StatusParticipacao.ACEITO,
      solicitadaEm: agora,
      respondidaEm: agora,
    });
  }

  return {
    /** Organizador convida pelo e-mail da pessoa: { email }. */
    async convidar(atividadeId, dados, usuario) {
      const atividade = await carregarAtividade(atividadeId);
      if (!ehOrganizador(atividade, usuario)) {
        throw new ErroProibido('Somente o organizador pode convidar pessoas');
      }
      const email = normalizarEmail((dados || {}).email);
      if (!email) throw new ErroValidacao([{ campo: 'email', mensagem: 'Informe o e-mail de quem será convidado' }]);

      const convidado = await usuarioRepository.buscarPorEmail(email);
      if (!convidado) throw new ErroNaoEncontrado('Nenhum usuário cadastrado com este e-mail');

      const [convites, participacoes] = await Promise.all([
        conviteRepository.listarPorAtividade(atividade.id),
        participacaoRepository.listarPorAtividade(atividade.id),
      ]);
      const novo = criarConvite(atividade, usuario, convidado, convites, participacoes, relogio());
      const [salvo] = await comConvidados([await conviteRepository.salvar(novo)]);
      return salvo;
    },

    /** Organizador acompanha quem foi convidado e quem respondeu. */
    async listarDaAtividade(atividadeId, usuario) {
      const atividade = await carregarAtividade(atividadeId);
      if (!ehOrganizador(atividade, usuario)) {
        throw new ErroProibido('Somente o organizador pode ver os convites');
      }
      return comConvidados(await conviteRepository.listarPorAtividade(atividade.id));
    },

    /** Convites recebidos pelo usuário logado, com um resumo da atividade. */
    async listarRecebidos(usuario, { status } = {}) {
      let convites = await conviteRepository.listarPorConvidado(usuario.id);
      if (status) {
        const s = String(status).toUpperCase();
        if (!Object.values(StatusConvite).includes(s)) {
          throw new ErroValidacao([{ campo: 'status', mensagem: 'Status deve ser PENDENTE, ACEITO ou RECUSADO' }]);
        }
        convites = convites.filter((c) => c.status === s);
      }
      const atividades = await Promise.all(convites.map((c) => atividadeRepository.buscarPorId(c.atividadeId)));
      return convites
        .map((c, i) => {
          const a = atividades[i];
          if (!a) return null;
          return {
            ...c,
            atividade: {
              id: a.id,
              titulo: a.titulo,
              tipo: a.tipo,
              dataHora: a.dataHora,
              local: a.local,
              status: a.status,
              visibilidade: a.visibilidade,
            },
          };
        })
        .filter(Boolean);
    },

    /** Convidado aceita ({ decisao: "ACEITAR" }) ou recusa ({ decisao: "RECUSAR" }). */
    async responder(conviteId, usuario, decisao) {
      const encontrado = await conviteRepository.buscarPorId(conviteId);
      if (!encontrado) throw new ErroNaoEncontrado('Convite não encontrado');
      await carregarAtividade(encontrado.atividadeId);

      // aceitar ocupa vaga: mesma trava por atividade usada no aceite de solicitações
      return comTrava(encontrado.atividadeId, async (repos) => {
        const convite = await repos.conviteRepository.buscarPorId(conviteId);
        const atividade = await repos.atividadeRepository.buscarPorId(convite.atividadeId);
        const participacoes = await repos.participacaoRepository.listarPorAtividade(atividade.id);
        const agora = relogio();

        const respondido = responderConvite(convite, atividade, participacoes, usuario, decisao, agora);
        const salvo = await repos.conviteRepository.atualizar(respondido);
        if (salvo.status === StatusConvite.ACEITO) {
          await confirmarPresenca(repos.participacaoRepository, atividade, participacoes, usuario.id, agora);
        }
        return salvo;
      });
    },
  };
}

module.exports = { criarConviteService };
