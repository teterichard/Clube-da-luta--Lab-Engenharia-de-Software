import './style.css'

// Caixinha de mensagem: tipo = "erro" | "sucesso" | "info"
function Aviso({ tipo = 'info', children }) {
  if (!children) return null
  return <div className={`aviso aviso_${tipo}`}>{children}</div>
}

export default Aviso
