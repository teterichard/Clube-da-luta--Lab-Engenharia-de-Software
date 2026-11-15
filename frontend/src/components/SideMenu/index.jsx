import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import './style.css'

// Menu lateral (wireframe 4.4)
const LINKS = [
  { para: '/', texto: 'Eventos' },
  { para: '/busca', texto: 'Busca' },
  { para: '/atividades/nova', texto: 'Criar atividade' },
  { para: '/convites', texto: 'Meus convites' },
  { para: '/notificacoes', texto: 'Notificações' },
  { para: '/comunidades', texto: 'Comunidades' },
  { para: '/contato', texto: 'Contato' },
]

// Fechado, o menu fica `inert`: some do Tab e do leitor de tela, em vez de só sair da tela.
// Aberto, o foco vai para o botão de fechar e Esc fecha.
function SideMenu({ id, aberto, onFechar }) {
  const fechar = useRef(null)

  useEffect(() => {
    if (!aberto) return undefined
    fechar.current?.focus()
    const aoTeclar = (e) => { if (e.key === 'Escape') onFechar() }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [aberto, onFechar])

  return (
    <>
      <div className={`menu-fundo ${aberto ? 'menu-fundo_aberto' : ''}`} onClick={onFechar} aria-hidden="true"></div>

      <nav id={id} className={`menu-lateral ${aberto ? 'menu-lateral_aberto' : ''}`} aria-label="Menu principal"
        inert={!aberto}>
        <div className="menu-topo">
          <span className="menu-titulo">Topa-aí</span>
          <button ref={fechar} className="menu-fechar" onClick={onFechar} aria-label="Fechar menu">×</button>
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
