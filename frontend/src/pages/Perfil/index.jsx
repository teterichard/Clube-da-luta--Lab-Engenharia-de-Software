import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Aviso from '../../components/Aviso'
import { getToken, setToken, getUsuarioLogado } from '../../services/api'

// Enquanto o UC de login (RF01/RF02) não existe, o usuário cola aqui um token JWT de teste.
// Gerar token: cd backend && node scripts/gerarToken.js 1 Organizador
function Perfil() {
  const navigate = useNavigate()
  const [token, setTokenTexto] = useState(getToken() || '')
  const [erro, setErro] = useState('')
  const usuario = getUsuarioLogado()

  function entrar(e) {
    e.preventDefault()
    if (token.split('.').length !== 3) {
      setErro('Isso não parece um token JWT (deve ter 3 partes separadas por ponto).')
      return
    }
    setToken(token)
    navigate('/')
  }

  function sair() {
    setToken(null)
    setTokenTexto('')
    navigate('/')
  }

  return (
    <main className="pagina">
      <h2 className="pagina-titulo">Perfil</h2>

      {usuario ? (
        <div className="painel">
          <p>Logado como <strong>{usuario.nome || 'Usuário'}</strong> (id {usuario.id})</p>
          <br />
          <button className="btn btn_vermelho btn_pequeno" onClick={sair}>Sair</button>
        </div>
      ) : (
        <Aviso tipo="info">Você não está logado.</Aviso>
      )}

      <form className="painel form" onSubmit={entrar}>
        <div className="campo">
          <label htmlFor="token">Token de teste (JWT)</label>
          <textarea id="token" value={token} onChange={(e) => { setTokenTexto(e.target.value); setErro('') }}
            placeholder="eyJhbGciOiJIUzI1NiIs..." />
          <span className="campo-dica">
            Login de verdade ainda vai ser feito. Gere um token com{' '}
            <code>node scripts/gerarToken.js 1 Organizador</code> dentro da pasta backend.
          </span>
        </div>
        <Aviso tipo="erro">{erro}</Aviso>
        <button className="btn" type="submit">Entrar</button>
      </form>
    </main>
  )
}

export default Perfil
