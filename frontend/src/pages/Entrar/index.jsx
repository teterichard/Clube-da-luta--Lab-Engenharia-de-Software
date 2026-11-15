import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import Aviso from '../../components/Aviso'
import { useAuth } from '../../contexts/AuthContext'

// RF02 — login com e-mail e senha
function Entrar() {
  const { usuario, entrar } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const destino = location.state?.de || '/'

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (usuario) return <Navigate to={destino} replace />

  async function enviar(e) {
    e.preventDefault()
    if (!email.trim() || !senha) {
      setErro('Preencha e-mail e senha.')
      return
    }
    setEnviando(true)
    setErro('')
    try {
      await entrar(email.trim(), senha)
      navigate(destino, { replace: true })
    } catch (e2) {
      setErro(e2.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main id="conteudo" className="pagina pagina_estreita">
      <h1 className="pagina-titulo">Entrar</h1>
      <p className="pagina-subtitulo">Que bom te ver de novo! Entre para encontrar sua próxima atividade.</p>

      <form className="painel form" onSubmit={enviar} noValidate>
        <div className="campo">
          <label htmlFor="email">E-mail</label>
          <input id="email" type="email" autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="campo">
          <label htmlFor="senha">Senha</label>
          <input id="senha" type="password" autoComplete="current-password" value={senha}
            onChange={(e) => setSenha(e.target.value)} required />
        </div>

        <Aviso tipo="erro">{erro}</Aviso>

        <button className="btn" type="submit" disabled={enviando}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>
        <p className="form-rodape">
          Ainda não tem conta? <Link to="/cadastro" state={location.state}>Cadastre-se</Link>
        </p>
      </form>
    </main>
  )
}

export default Entrar
