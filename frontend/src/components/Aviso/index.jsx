import './style.css'

// Caixinha de mensagem: tipo = "erro" | "sucesso" | "info"
// Erros usam role="alert" (lidos na hora pelo leitor de tela); os demais, role="status".
function Aviso({ tipo = 'info', children }) {
  if (!children) return null
  return (
    <div className={`aviso aviso_${tipo}`} role={tipo === 'erro' ? 'alert' : 'status'}>
      {children}
    </div>
  )
}

export default Aviso
