import { useEffect, useState } from 'react'

import Aviso from '../../components/Aviso'
import Tag from '../../components/Tag'
import {
  cancelarInscricao,
  listarConvitesRecebidos,
  listarMinhasInscricoes,
  responderConvite,
  solicitarParticipacao,
} from '../../services/api'
import { STATUS_PARTICIPACAO } from '../../utils/status'

// Visão de quem não organiza: solicitar (passo 6), acompanhar, cancelar (P6) ou responder um convite (RF07)
function MinhaParticipacao({ atividade, onAtualizar }) {
  const [inscricao, setInscricao] = useState(null)
  const [convite, setConvite] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false)

  async function carregar() {
    const [inscricoes, convites] = await Promise.all([listarMinhasInscricoes(), listarConvitesRecebidos('PENDENTE')])
    const daAtividade = (lista) => lista.filter((x) => String(x.atividadeId) === String(atividade.id))
    // a inscrição que vale é a mais recente que ainda está em andamento (ou a última, se todas acabaram)
    const minhas = daAtividade(inscricoes)
    setInscricao(minhas.find((p) => p.status === 'PENDENTE' || p.status === 'ACEITO') || minhas[0] || null)
    setConvite(daAtividade(convites)[0] || null)
  }

  useEffect(() => {
    carregar().catch((e) => setErro(e.message)).finally(() => setCarregando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atividade.id])

  async function agir(fn, sucesso) {
    setEnviando(true)
    setErro('')
    setMensagem('')
    try {
      await fn()
      await carregar()
      onAtualizar()
      setMensagem(sucesso)
      setConfirmandoCancelamento(false)
    } catch (e) {
      // 409: sem vagas, já solicitou, atividade já começou...
      setErro(e.message)
    } finally {
      setEnviando(false)
    }
  }

  if (carregando) return <p className="vazio" role="status">Carregando sua situação...</p>

  const ativa = inscricao && (inscricao.status === 'PENDENTE' || inscricao.status === 'ACEITO')
  const aberta = atividade.status === 'AGENDADA'

  return (
    <div className="minha-participacao">
      <Aviso tipo="sucesso">{mensagem}</Aviso>
      <Aviso tipo="erro">{erro}</Aviso>

      {inscricao && (
        <p className="minha-situacao">
          Sua situação: <Tag mapa={STATUS_PARTICIPACAO} status={inscricao.status} />
        </p>
      )}

      {convite && aberta && !ativa && (
        <div className="convite-recebido">
          <p><strong>Você foi convidado!</strong> Aceitando, sua presença já fica confirmada.</p>
          <div className="acoes">
            <button className="btn btn_pequeno btn_cinza" disabled={enviando}
              onClick={() => agir(() => responderConvite(convite.id, 'RECUSAR'), 'Convite recusado.')}>Recusar</button>
            <button className="btn btn_pequeno" disabled={enviando || atividade.vagas === 0}
              onClick={() => agir(() => responderConvite(convite.id, 'ACEITAR'), 'Presença confirmada! Até lá 🙌')}>
              Aceitar convite
            </button>
          </div>
        </div>
      )}

      {aberta && ativa && (confirmandoCancelamento ? (
        <div className="confirmacao" role="alertdialog" aria-labelledby="texto-cancelar">
          <p id="texto-cancelar">
            {inscricao.status === 'ACEITO' ? 'Cancelar sua presença? A vaga volta a ficar livre.' : 'Desistir da solicitação?'}
          </p>
          <div className="acoes">
            <button className="btn btn_pequeno btn_cinza" onClick={() => setConfirmandoCancelamento(false)}>Voltar</button>
            <button className="btn btn_pequeno btn_vermelho" disabled={enviando} autoFocus
              onClick={() => agir(() => cancelarInscricao(inscricao.id), 'Inscrição cancelada.')}>
              Sim, cancelar
            </button>
          </div>
        </div>
      ) : (
        <button className="btn btn_cinza detalhe-btn" onClick={() => setConfirmandoCancelamento(true)}>
          {inscricao.status === 'ACEITO' ? 'Cancelar minha presença' : 'Desistir da solicitação'}
        </button>
      ))}

      {aberta && !ativa && !convite && atividade.visibilidade === 'PUBLICA' && (
        <button className="btn detalhe-btn" disabled={enviando || atividade.vagas === 0}
          onClick={() => agir(() => solicitarParticipacao(atividade.id),
            'Solicitação enviada! Você será avisado quando o organizador responder.')}>
          {atividade.vagas === 0 ? 'Atividade lotada' : enviando ? 'Enviando...' : 'Solicitar participação'}
        </button>
      )}
    </div>
  )
}

export default MinhaParticipacao
