// O "arco do passe" da marca em tamanho grande: trajetória tracejada e a bola chegando.
// Elemento só decorativo (aria-hidden).
function Arco({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 320 170" fill="none" aria-hidden="true">
      <path d="M14 160C60 64 160 18 268 40" stroke="var(--crest)" strokeWidth="5" strokeLinecap="round"
        strokeDasharray="2 16" />
      <circle cx="14" cy="160" r="9" fill="var(--crest)" />
      <circle cx="282" cy="44" r="26" fill="var(--mandarin)" />
      <path d="M262 30c12 6 26 6 40-2M264 60c12-7 26-8 38-2" stroke="var(--ink)" strokeOpacity=".28"
        strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export default Arco
