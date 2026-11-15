import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as api from '../services/api'

// Sessão do usuário: quem está logado, entrar, cadastrar e sair.
// O token fica no localStorage (services/api.js); aqui guardamos o perfil para as telas.
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // começa com o que dá para ler do token, e confirma com o /me logo em seguida
  const [usuario, setUsuario] = useState(() => api.lerToken())
  const [verificando, setVerificando] = useState(() => !!api.lerToken())
  // true quando a pessoa clicou em "Sair": aí não faz sentido voltar à página anterior no próximo login
  const [saiuPorConta, setSaiuPorConta] = useState(false)

  const sair = useCallback(({ voluntario = false } = {}) => {
    api.setToken(null)
    setSaiuPorConta(voluntario)
    setUsuario(null)
  }, [])

  useEffect(() => {
    if (!api.lerToken()) {
      api.setToken(null)
      return undefined
    }
    let ativo = true
    api.buscarPerfil()
      .then((perfil) => { if (ativo) setUsuario(perfil) })
      .catch((e) => { if (ativo && e.status === 401) sair() })
      .finally(() => { if (ativo) setVerificando(false) })
    return () => { ativo = false }
  }, [sair])

  // qualquer 401 da API derruba a sessão (e o próximo login volta para onde a pessoa estava)
  useEffect(() => {
    const expirou = () => sair()
    window.addEventListener(api.EVENTO_SESSAO_EXPIRADA, expirou)
    return () => window.removeEventListener(api.EVENTO_SESSAO_EXPIRADA, expirou)
  }, [sair])

  const entrar = useCallback(async (email, senha) => {
    const { token, usuario: perfil } = await api.login(email, senha)
    api.setToken(token)
    setUsuario(perfil)
    return perfil
  }, [])

  const cadastrar = useCallback(async (dados) => {
    const { token, usuario: perfil } = await api.cadastrar(dados)
    api.setToken(token)
    setUsuario(perfil)
    return perfil
  }, [])

  const valor = useMemo(() => ({
    usuario, verificando, saiuPorConta, entrar, cadastrar, sair, atualizarUsuario: setUsuario,
  }), [usuario, verificando, saiuPorConta, entrar, cadastrar, sair])

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return contexto
}
