// Comunicação com o back-end (API REST - ver backend/README.md)
// O token JWT do login fica no localStorage; a sessão em si é controlada pelo AuthContext.

const BASE_URL = import.meta.env.VITE_API_URL || '/api'
const CHAVE_TOKEN = 'topaai_token'

// Avisado quando a API responde 401 numa rota protegida (token expirado ou inválido)
export const EVENTO_SESSAO_EXPIRADA = 'topaai:sessao-expirada'

// localStorage pode falhar (modo privado, bloqueio do navegador): nesse caso a sessão vale só até recarregar
let tokenEmMemoria = null

export function getToken() {
  try {
    return localStorage.getItem(CHAVE_TOKEN) || tokenEmMemoria
  } catch {
    return tokenEmMemoria
  }
}

export function setToken(token) {
  tokenEmMemoria = token || null
  try {
    if (token) localStorage.setItem(CHAVE_TOKEN, token)
    else localStorage.removeItem(CHAVE_TOKEN)
  } catch {
    // segue só com a cópia em memória
  }
}

// Lê o "sub" (id do usuário) e o nome de dentro do token, sem validar a assinatura.
// Serve só para a tela saber quem está logado (ex.: se é o organizador) antes do /me responder.
export function lerToken(token = getToken()) {
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (payload.exp && payload.exp * 1000 < Date.now()) return null
    return { id: payload.sub, nome: payload.nome }
  } catch {
    return null
  }
}

// Erro com status HTTP e lista de detalhes (campos inválidos) vindos da API
export class ErroApi extends Error {
  constructor(mensagem, status, detalhes = []) {
    super(mensagem)
    this.status = status
    this.detalhes = detalhes
  }
}

async function requisicao(caminho, { method = 'GET', body, publica = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let resposta
  try {
    resposta = await fetch(`${BASE_URL}${caminho}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ErroApi('Não foi possível conectar ao servidor. O back-end está rodando?', 0)
  }

  if (resposta.status === 204) return null

  const dados = await resposta.json().catch(() => null)
  if (resposta.status === 401 && !publica) {
    setToken(null)
    window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA))
  }
  if (!resposta.ok) {
    const mensagem = (dados && dados.erro) || 'Algo deu errado'
    throw new ErroApi(mensagem, resposta.status, (dados && dados.detalhes) || [])
  }
  return dados
}

// ---- Autenticação (RF01/RF02) e perfil ----

export function cadastrar(dados) {
  return requisicao('/auth/cadastro', { method: 'POST', body: dados, publica: true })
}

export function login(email, senha) {
  return requisicao('/auth/login', { method: 'POST', body: { email, senha }, publica: true })
}

export function buscarPerfil() {
  return requisicao('/usuarios/me')
}

export function atualizarPerfil(dados) {
  return requisicao('/usuarios/me', { method: 'PATCH', body: dados })
}

// ---- Atividades (UC Criar Atividade) ----

export function criarAtividade(dados) {
  return requisicao('/atividades', { method: 'POST', body: dados })
}

export function listarAtividades(filtros = {}) {
  const params = new URLSearchParams()
  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor !== '' && valor !== false && valor != null) params.append(chave, valor)
  })
  const query = params.toString()
  return requisicao(`/atividades${query ? `?${query}` : ''}`)
}

export function buscarAtividade(id) {
  return requisicao(`/atividades/${id}`)
}

// ---- Participações (UC Inscrever-se em atividade) ----

export function solicitarParticipacao(atividadeId) {
  return requisicao(`/atividades/${atividadeId}/participacoes`, { method: 'POST' })
}

export function listarSolicitacoes(atividadeId) {
  return requisicao(`/atividades/${atividadeId}/participacoes`)
}

export function responderSolicitacao(participacaoId, decisao) {
  return requisicao(`/participacoes/${participacaoId}`, { method: 'PATCH', body: { decisao } })
}

// ---- Gestão da atividade pelo organizador (RF04 / RF11) ----

export function editarAtividade(id, dados) {
  return requisicao(`/atividades/${id}`, { method: 'PATCH', body: dados })
}

export function excluirAtividade(id) {
  return requisicao(`/atividades/${id}`, { method: 'DELETE' })
}

/** acao: 'iniciar' | 'cancelar' | 'concluir' */
export function mudarStatusAtividade(id, acao) {
  return requisicao(`/atividades/${id}/${acao}`, { method: 'POST' })
}

export function listarAtividadesOrganizadas() {
  return requisicao('/atividades/organizadas')
}

// ---- Minhas inscrições ----

export function listarMinhasInscricoes() {
  return requisicao('/participacoes/minhas')
}

export function cancelarInscricao(participacaoId) {
  return requisicao(`/participacoes/${participacaoId}/cancelar`, { method: 'POST' })
}

// ---- Convites (RF07) ----

export function convidar(atividadeId, email) {
  return requisicao(`/atividades/${atividadeId}/convites`, { method: 'POST', body: { email } })
}

export function listarConvitesDaAtividade(atividadeId) {
  return requisicao(`/atividades/${atividadeId}/convites`)
}

export function listarConvitesRecebidos(status) {
  return requisicao(`/convites${status ? `?status=${status}` : ''}`)
}

export function responderConvite(conviteId, decisao) {
  return requisicao(`/convites/${conviteId}`, { method: 'PATCH', body: { decisao } })
}
