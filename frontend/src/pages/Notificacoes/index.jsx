import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './style.css'

import Aviso from '../../components/Aviso'
import {
  EVENTO_NOTIFICACOES_LIDAS,
  listarNotificacoes,
  marcarNotificacaoLida,
  marcarTodasNotificacoesLidas,
} from '../../services/api'

const avisarLeitura = () => window.dispatchEvent(new Event(EVENTO_NOTIFICACOES_LIDAS))

function destino(n) {
  if (n.atividadeId) return `/atividades/${n.atividadeId}`
  if (n.comunidadeId) return `/comunidades/${n.comunidadeId}`
  return null
}

function quando(data) {
  return new Date(data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// Central de notificações (critério de qualidade "confiabilidade das notificações" da wiki)
function Notificacoes() {
  const navigate = useNavigate()
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState('')

  function carregar() {
    return listarNotificacoes().then(setDados).catch((e) => setErro(e.message))
  }

  useEffect(() => { carregar() }, [])

  async function abrir(n) {
    try {
      if (!n.lida) {
        await marcarNotificacaoLida(n.id)
        avisarLeitura()
      }
    } catch {
      // se falhar ao marcar, ainda assim leva a pessoa para o que interessa
    }
    const para = destino(n)
    if (para) navigate(para)
    else carregar()
  }

  async function lerTodas() {
    setErro('')
    try {
      await marcarTodasNotificacoesLidas()
      avisarLeitura()
      await carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <main id="conteudo" className="pagina">
      <div className="pagina-topo">
        <div>
          <h1 className="pagina-titulo">Notificações</h1>
          <p className="pagina-subtitulo">
            {dados ? `${dados.naoLidas} não lida${dados.naoLidas === 1 ? '' : 's'}` : ' '}
          </p>
        </div>
        {dados?.naoLidas > 0 && (
          <button type="button" className="btn btn_pequeno btn_cinza" onClick={lerTodas}>Marcar todas como lidas</button>
        )}
      </div>

      <Aviso tipo="erro">{erro}</Aviso>
      {!dados && !erro && <p className="vazio" role="status">Carregando...</p>}

      {dados && (
        <section className="painel">
          {dados.itens.length === 0 ? (
            <p className="vazio">Nada por aqui ainda. Quando alguém responder ou convidar você, aparece aqui.</p>
          ) : (
            <ul className="lista-cartoes">
              {dados.itens.map((n) => (
                <li key={n.id}>
                  <button type="button" className={`notificacao ${n.lida ? '' : 'notificacao_nova'}`} onClick={() => abrir(n)}>
                    {!n.lida && <span className="sr-only">Nova: </span>}
                    <span className="notificacao-texto">{n.mensagem}</span>
                    <span className="notificacao-data">{quando(n.criadaEm)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  )
}

export default Notificacoes
