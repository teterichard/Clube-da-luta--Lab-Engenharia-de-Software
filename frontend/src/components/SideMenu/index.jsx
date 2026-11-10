import { NavLink } from 'react-router-dom'
import './style.css'

// Menu lateral (wireframe 4.4): Eventos, Comunidades, Busca e Contato
const LINKS = [
  { para: '/', texto: 'Eventos' },
  { para: '/busca', texto: 'Busca' },
  { para: '/atividades/nova', texto: 'Criar atividade' },
  { para: '/comunidades', texto: 'Comunidades' },
  { para: '/contato', texto: 'Contato' },
]

function SideMenu({ aberto, onFechar }) {
  return (
    <>
      <div className={`menu-fundo ${aberto ? 'menu-fundo_aberto' : ''}`} onClick={onFechar}></div>

      <nav className={`menu-lateral ${aberto ? 'menu-lateral_aberto' : ''}`}>
        <div className="menu-topo">
          <span className="menu-titulo">Topa-aí</span>
          <button className="menu-fechar" onClick={onFechar} aria-label="Fechar menu">×</button>
        </div>

        {LINKS.map((link) => (
          <NavLink
            key={link.para}
            to={link.para}
            end
            onClick={onFechar}
            className={({ isActive }) => `menu-link ${isActive ? 'menu-link_ativo' : ''}`}
          >
            {link.texto}
          </NavLink>
        ))}
      </nav>
    </>
  )
}

export default SideMenu
