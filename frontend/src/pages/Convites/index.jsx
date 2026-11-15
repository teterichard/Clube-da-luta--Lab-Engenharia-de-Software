import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import Aviso from '../../components/Aviso'
import Tag from '../../components/Tag'
import { listarConvitesRecebidos, responderConvite } from '../../services/api'
import { formatarData } from '../../utils/atividade'
import { STATUS_CONVITE } from '../../utils/status'

// Convites recebidos (RF07) — lugar único para não perder convite (persona Mariana)
function Convites() {
  const [convites, setConvites] = useState(null)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [respondendo, setRespondendo] = useState(null)

  function carregar() {
    return listarConvitesRecebidos().then(setConvites).catch((e) => setErro(e.message))
  }

  useEffect(() => { carregar() }, [])

  async function responder(convite, decisao) {
    setRespondendo(convite.id)
    setErro('')
    setMensagem('')
    try {
      await responderConvite(convite.id, decisao)
      setMensagem(decisao === 'ACEITAR'
        ? `Presença confirmada em "${convite.atividade.titulo}"!`
        : `Convite para "${convite.atividade.titulo}" recusado.`)
      await carregar()
    } catch (e) {
      setErro(e.message)
    } finally {
      setRespondendo(null)
    }
  }

  const pendentes = (convites || []).filter((c) => c.status === 'PENDENTE' && c.atividade.status === 'AGENDADA')
  const outros = (convites || []).filter((c) => !pendentes.includes(c))

  return (
    <main id="conteudo" className="pagina">
      <h1 className="pagina-titulo">Meus convites</h1>
      <p className="pagina-subtitulo">Atividades para as quais alguém chamou você.</p>

      <Aviso tipo="sucesso">{mensagem}</Aviso>
      <Aviso tipo="erro">{erro}</Aviso>
      {!convites && !erro && <p className="vazio" role="status">Carregando...</p>}

      {convites && (
        <>
          <section className="painel" aria-labelledby="titulo-pendentes">
            <h2 id="titulo-pendentes" className="secao-titulo">Esperando sua resposta</h2>
            {pendentes.length === 0 && <p className="vazio">Nenhum convite pendente.</p>}
            <ul className="lista-cartoes">
              {pendentes.map((c) => (
                <li key={c.id} className="cartao-linha">
                  <div>
                    <Link to={`/atividades/${c.atividadeId}`} className="cartao-titulo">{c.atividade.titulo}</Link>
                    <span className="cartao-sub">{formatarData(c.atividade.dataHora)} · {c.atividade.local}</span>
                  </div>
                  <div className="acoes">
                    <button className="btn btn_pequeno btn_cinza" disabled={respondendo === c.id}
                      onClick={() => responder(c, 'RECUSAR')} aria-label={`Recusar convite para ${c.atividade.titulo}`}>Recusar</button>
                    <button className="btn btn_pequeno" disabled={respondendo === c.id}
                      onClick={() => responder(c, 'ACEITAR')} aria-label={`Aceitar convite para ${c.atividade.titulo}`}>Aceitar</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {outros.length > 0 && (
            <section className="painel" aria-labelledby="titulo-historico">
              <h2 id="titulo-historico" className="secao-titulo">Respondidos ou encerrados</h2>
              <ul className="lista-cartoes">
                {outros.map((c) => (
                  <li key={c.id} className="cartao-linha">
                    <div>
                      <Link to={`/atividades/${c.atividadeId}`} className="cartao-titulo">{c.atividade.titulo}</Link>
                      <span className="cartao-sub">{formatarData(c.atividade.dataHora)}</span>
                    </div>
                    <Tag mapa={STATUS_CONVITE} status={c.status} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default Convites
