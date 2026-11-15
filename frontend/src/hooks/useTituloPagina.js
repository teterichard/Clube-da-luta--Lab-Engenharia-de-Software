import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Título da aba por rota: leitores de tela anunciam a troca de página e o histórico fica legível
const TITULOS = [
  [/^\/$/, 'Início'],
  [/^\/busca/, 'Buscar atividades'],
  [/^\/atividades\/nova$/, 'Criar atividade'],
  [/^\/atividades\/\d+\/editar$/, 'Editar atividade'],
  [/^\/atividades\/\d+$/, 'Atividade'],
  [/^\/convites/, 'Meus convites'],
  [/^\/notificacoes/, 'Notificações'],
  [/^\/comunidades\/nova$/, 'Criar comunidade'],
  [/^\/comunidades\/\d+\/editar$/, 'Editar comunidade'],
  [/^\/comunidades\/\d+$/, 'Comunidade'],
  [/^\/comunidades/, 'Comunidades'],
  [/^\/perfil/, 'Meu perfil'],
  [/^\/entrar/, 'Entrar'],
  [/^\/cadastro/, 'Criar conta'],
  [/^\/contato/, 'Contato'],
]

export function useTituloPagina() {
  const { pathname } = useLocation()
  useEffect(() => {
    const encontrado = TITULOS.find(([padrao]) => padrao.test(pathname))
    document.title = encontrado ? `${encontrado[1]} · Topa-aí` : 'Página não encontrada · Topa-aí'
  }, [pathname])
}
