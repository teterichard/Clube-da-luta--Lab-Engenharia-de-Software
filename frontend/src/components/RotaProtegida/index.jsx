import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

// Todas as rotas da API exigem login (pré-condição dos casos de uso):
// sem sessão, manda para /entrar e volta para a página pedida depois.
function RotaProtegida() {
  const { usuario, verificando, saiuPorConta } = useAuth()
  const location = useLocation()

  // ao recarregar a página, espera o /me para as telas já receberem o perfil completo
  if (verificando) {
    return <main id="conteudo" className="pagina"><p className="vazio" role="status">Carregando...</p></main>
  }

  if (!usuario) {
    const state = saiuPorConta ? undefined : { de: location.pathname + location.search }
    return <Navigate to="/entrar" replace state={state} />
  }
  return <Outlet />
}

export default RotaProtegida
