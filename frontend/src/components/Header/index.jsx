import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './style.css'

import SearchBar from '../SearchBar'
import SideMenu from '../SideMenu'

// Cabeçalho usado em todas as telas: menu, nome do app, perfil e barra de busca
function Header({ mostrarBusca = true }) {
  const [menuAberto, setMenuAberto] = useState(false)
  const navigate = useNavigate()

  // A busca da barra leva para a tela de Busca filtrando pelo local digitado
  function buscar(termo) {
    navigate(termo ? `/busca?local=${encodeURIComponent(termo)}` : '/busca')
  }

  return (
    <header>
      <div className="firstBox">
        <button className="icon-btn" onClick={() => setMenuAberto(true)} aria-label="Abrir menu">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6"></line>
            <line x1="4" y1="12" x2="20" y2="12"></line>
            <line x1="4" y1="18" x2="20" y2="18"></line>
          </svg>
        </button>

        <Link to="/" className="firstName">Topa-aí</Link>

        <Link to="/perfil" className="icon-btn" aria-label="Perfil">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </Link>
      </div>

      {mostrarBusca && (
        <div className="searchBox">
          <SearchBar onSearch={buscar} />
        </div>
      )}

      <SideMenu aberto={menuAberto} onFechar={() => setMenuAberto(false)} />
    </header>
  )
}

export default Header
