import { useEffect, useState } from 'react'

import Aviso from '../../components/Aviso'
import { convidar, listarConvitesDaAtividade } from '../../services/api'
import Tag from '../../components/Tag'
import { STATUS_CONVITE } from '../../utils/status'

// RF07 / UC 5.2 passo 4 — organizador convida pessoas específicas pelo e-mail
function Convites({ atividade }) {
  const [lista, setLista] = useState([])
  const [email, setEmail] = useState('')
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)

  function carregar() {
    return listarConvitesDaAtividade(atividade.id).then(setLista).catch((e) => setErro(e.message))
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atividade.id])

  async function enviar(e) {
    e.preventDefault()
    if (!email.trim()) {
      setErro('Informe o e-mail de quem você quer convidar.')
      return
    }
    setEnviando(true)
    setErro('')
    setMensagem('')
    try {
      const convite = await convidar(atividade.id, email.trim())
      setMensagem(`Convite enviado para ${convite.convidado?.nome || email.trim()}.`)
      setEmail('')
      await carregar()
    } catch (e2) {
      setErro(e2.message)
    } finally {
      setEnviando(false)
    }
  }

  const aberta = atividade.status === 'AGENDADA'

  return (
    <section className="painel" aria-labelledby="titulo-convites">
      <h2 id="titulo-convites" className="secao-titulo">Convites</h2>
      <p className="secao-texto">
        {atividade.visibilidade === 'PRIVADA'
          ? 'Atividade privada: só participa quem você convidar.'
          : 'Chame alguém direto: quem aceitar o convite já fica confirmado.'}
      </p>

      {aberta && (
        <form className="convite-form" onSubmit={enviar} noValidate>
          <label htmlFor="email-convite" className="sr-only">E-mail da pessoa</label>
          <input id="email-convite" type="email" placeholder="email@exemplo.com" value={email}
            onChange={(e) => { setEmail(e.target.value); setErro('') }} />
          <button className="btn btn_pequeno" type="submit" disabled={enviando}>{enviando ? 'Enviando...' : 'Convidar'}</button>
        </form>
      )}
      <Aviso tipo="erro">{erro}</Aviso>
      <Aviso tipo="sucesso">{mensagem}</Aviso>

      {lista.length === 0 ? (
        <p className="vazio">Nenhum convite enviado ainda.</p>
      ) : (
        <ul className="solicitacoes">
          {lista.map((c) => (
            <li key={c.id} className="solicitacao">
              <div className="avatar" aria-hidden="true">{(c.convidado?.nome || '?').slice(0, 2).toUpperCase()}</div>
              <div className="solicitacao-info">
                <strong>{c.convidado?.nome || `Usuário #${c.convidadoId}`}</strong>
                <span>convidado em {new Date(c.criadoEm).toLocaleDateString('pt-BR')}</span>
              </div>
              <Tag mapa={STATUS_CONVITE} status={c.status} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default Convites
