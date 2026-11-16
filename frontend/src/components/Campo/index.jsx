// Label + campo + mensagem de erro (ou dica). O erro fica ligado ao campo por aria-describedby,
// então leitores de tela anunciam a mensagem junto com o campo.
import { Children, cloneElement, isValidElement } from 'react'

function Campo({ nome, label, erro, dica, children }) {
  const idMensagem = `${nome}-mensagem`
  const temMensagem = !!(erro || dica)
  const campo = Children.map(children, (filho) => (isValidElement(filho)
    ? cloneElement(filho, {
      'aria-invalid': erro ? true : undefined,
      'aria-describedby': temMensagem ? idMensagem : undefined,
    })
    : filho))

  return (
    <div className={`campo ${erro ? 'campo_erro' : ''}`}>
      <label htmlFor={nome}>{label}</label>
      {campo}
      {erro && <span id={idMensagem} className="campo-erro">{erro}</span>}
      {!erro && dica && <span id={idMensagem} className="campo-dica">{dica}</span>}
    </div>
  )
}

export default Campo
