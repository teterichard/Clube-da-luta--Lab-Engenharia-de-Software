// Comunicação com o back-end (API REST - ver backend/README.md)
// O token JWT fica salvo no localStorage enquanto o UC de login não existe.

const BASE_URL = import.meta.env.VITE_API_URL || '/api'
const CHAVE_TOKEN = 'topaai_token'

export function getToken() {
  return localStorage.getItem(CHAVE_TOKEN)
}

export function setToken(token) {
  if (token) localStorage.setItem(CHAVE_TOKEN, token.trim())
  else localStorage.removeItem(CHAVE_TOKEN)
}

// Lê o "sub" (id do usuário) e o nome de dentro do token, sem validar a assinatura.
// Serve só para a tela saber quem está logado (ex.: se é o organizador).
export function getUsuarioLogado() {
  const token = getToken()
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
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

async function requisicao(caminho, { method = 'GET', body } = {}) {
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

  const dados = await resposta.json().catch(() => null)
  if (!resposta.ok) {
    const mensagem = (dados && dados.erro) || 'Algo deu errado'
    throw new ErroApi(mensagem, resposta.status, (dados && dados.detalhes) || [])
  }
  return dados
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
