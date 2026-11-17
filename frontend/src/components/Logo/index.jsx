import './style.css'

// Marca do Topa-aí: o "arco do passe" — alguém lança (ponto amarelo) e a bola (laranja) chega em quem topou.
export function LogoMarca({ tamanho = 36, className = '' }) {
  return (
    <svg className={`logo-marca ${className}`} width={tamanho} height={tamanho} viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="14" fill="var(--forest)" />
      <path d="M11 34C14.5 21 24 13.5 34 14.5" fill="none" stroke="var(--crest)" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="11" cy="34" r="3.2" fill="var(--crest)" />
      <circle cx="35" cy="14.5" r="6" fill="var(--mandarin)" />
    </svg>
  )
}

// Marca + nome. `claro` = versão para fundo verde (texto em branco).
function Logo({ tamanho = 34, claro = false }) {
  return (
    <span className={`logo ${claro ? 'logo_claro' : ''}`}>
      <LogoMarca tamanho={tamanho} />
      <span className="logo-texto">topa<span className="logo-hifen">-</span>aí</span>
    </span>
  )
}

export default Logo
