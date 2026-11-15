import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './style.css'

import { EVENTO_NOTIFICACOES_LIDAS, listarNotificacoes } from '../../services/api'

const INTERVALO_MS = 60_000

// Sininho do topo com o número de notificações não lidas.
// Atualiza ao trocar de página, a cada minuto e quando a tela de notificações marca algo como lido.
function SinoNotificacoes() {
  const location = useLocation()
  const [naoLidas, setNaoLidas] = useState(0)

  useEffect(() => {
    let ativo = true
    const atualizar = () => listarNotificacoes({ naoLidas: true })
      .then((r) => { if (ativo) setNaoLidas(r.naoLidas) })
      .catch(() => {})

    atualizar()
    const timer = setInterval(atualizar, INTERVALO_MS)
    window.addEventListener(EVENTO_NOTIFICACOES_LIDAS, atualizar)
    return () => {
      ativo = false
      clearInterval(timer)
      window.removeEventListener(EVENTO_NOTIFICACOES_LIDAS, atualizar)
    }
  }, [location.pathname])

  const rotulo = naoLidas > 0 ? `Notificações: ${naoLidas} não lida${naoLidas > 1 ? 's' : ''}` : 'Notificações'

  return (
    <Link to="/notificacoes" className="icon-btn sino" aria-label={rotulo}>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
      {naoLidas > 0 && <span className="sino-contador" aria-hidden="true">{naoLidas > 9 ? '9+' : naoLidas}</span>}
    </Link>
  )
}

export default SinoNotificacoes
