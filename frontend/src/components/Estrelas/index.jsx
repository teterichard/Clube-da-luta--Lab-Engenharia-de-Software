import './style.css'

// Nota de 1 a 5. Sem onEscolher, só mostra; com onEscolher, vira um seletor acessível por teclado
function Estrelas({ nota = 0, onEscolher, rotulo = 'Escolha uma nota', grande = false, desabilitado = false }) {
  const valor = Math.round(nota || 0)
  const classe = `estrelas ${grande ? 'estrelas_grande' : ''}`

  if (!onEscolher) {
    return (
      <span className={classe} role="img" aria-label={`Nota ${nota || 0} de 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} aria-hidden="true" className={`estrela ${n <= valor ? 'estrela_cheia' : ''}`}>★</span>
        ))}
      </span>
    )
  }

  return (
    <span className={classe} role="radiogroup" aria-label={rotulo}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={n === valor} disabled={desabilitado}
          aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
          className={`estrela ${n <= valor ? 'estrela_cheia' : ''}`} onClick={() => onEscolher(n)}>
          ★
        </button>
      ))}
    </span>
  )
}

export default Estrelas
