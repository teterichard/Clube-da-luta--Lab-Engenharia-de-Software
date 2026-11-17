import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './style.css'

import SearchBar from '../SearchBar'
import SideMenu from '../SideMenu'
import SinoNotificacoes from '../SinoNotificacoes'
import Logo from '../Logo'
import { useAuth } from '../../contexts/AuthContext'

// Cabeçalho usado em todas as telas: menu, nome do app, perfil e barra de busca
function Header({ mostrarBusca = true }) {
  const [menuAberto, setMenuAberto] = useState(false)
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const fecharMenu = useCallback(() => setMenuAberto(false), [])

  // A busca da barra leva para a tela de Busca filtrando pelo local digitado
  function buscar(termo) {
    navigate(termo ? `/busca?local=${encodeURIComponent(termo)}` : '/busca')
  }

  return (
    <header className="topo">
      <a href="#conteudo" className="pular-conteudo">Pular para o conteúdo</a>
      <div className="firstBox">
        <button className="icon-btn" onClick={() => setMenuAberto(true)} aria-label="Abrir menu"
          aria-expanded={menuAberto} aria-controls="menu-principal">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="4" y1="6" x2="20" y2="6"></line>
            <line x1="4" y1="12" x2="20" y2="12"></line>
            <line x1="4" y1="18" x2="20" y2="18"></line>
          </svg>
        </button>

        <Link to="/" className="firstName" aria-label="Topa-aí, página inicial"><Logo claro /></Link>

        <div className="topo-acoes">
          {usuario && <SinoNotificacoes />}
          <Link to={usuario ? '/perfil' : '/entrar'} className="icon-btn"
            aria-label={usuario ? `Perfil de ${usuario.nome}` : 'Entrar'}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </Link>
        </div>
      </div>

      {mostrarBusca && usuario && (
        <div className="searchBox">
          <SearchBar onSearch={buscar} />
        </div>
      )}

      <SideMenu id="menu-principal" aberto={menuAberto} onFechar={fecharMenu} />
    </header>
  )
}

export default Header
