import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import Aviso from '../../components/Aviso'
import { excluirAtividade, mudarStatusAtividade } from '../../services/api'

// RF04 / RF11 — o que o organizador pode fazer com a atividade em cada status
const ACOES = {
  AGENDADA: ['iniciar', 'cancelar'],
  ATIVA: ['concluir', 'cancelar'],
}

const TEXTOS = {
  iniciar: { botao: 'Iniciar atividade', classe: '' },
  concluir: { botao: 'Concluir atividade', classe: '' },
  cancelar: {
    botao: 'Cancelar atividade',
    classe: 'btn_vermelho',
    confirmacao: 'Cancelar a atividade? Todos os inscritos serão avisados.',
  },
  excluir: {
    botao: 'Excluir',
    classe: 'btn_vermelho',
    confirmacao: 'Excluir a atividade de vez? Isso não pode ser desfeito.',
  },
}

function AcoesOrganizador({ atividade, onAtualizar }) {
  const navigate = useNavigate()
  const [confirmando, setConfirmando] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  async function executar(acao) {
    setEnviando(true)
    setErro('')
    try {
      if (acao === 'excluir') {
        await excluirAtividade(atividade.id)
        navigate('/', { state: { mensagem: 'Atividade excluída.' } })
        return
      }
      onAtualizar(await mudarStatusAtividade(atividade.id, acao))
      setConfirmando(null)
    } catch (e) {
      setErro(e.message)
    } finally {
      setEnviando(false)
    }
  }

  function clicar(acao) {
    if (TEXTOS[acao].confirmacao) setConfirmando(acao)
    else executar(acao)
  }

  const disponiveis = ACOES[atividade.status] || []
  const podeEditar = atividade.status === 'AGENDADA'
  // com participantes confirmados o caminho é cancelar (o back-end recusa a exclusão)
  const podeExcluir = atividade.status === 'AGENDADA' && atividade.vagas === atividade.numeroIntegrantes

  if (disponiveis.length === 0 && !podeExcluir) return null

  return (
    <section className="painel" aria-labelledby="titulo-gerenciar">
      <h2 id="titulo-gerenciar" className="secao-titulo">Gerenciar atividade</h2>
      <Aviso tipo="erro">{erro}</Aviso>

      {confirmando ? (
        <div className="confirmacao" role="alertdialog" aria-labelledby="texto-confirmacao">
          <p id="texto-confirmacao">{TEXTOS[confirmando].confirmacao}</p>
          <div className="acoes">
            <button type="button" className="btn btn_pequeno btn_cinza" onClick={() => setConfirmando(null)} disabled={enviando}>
              Voltar
            </button>
            <button type="button" className="btn btn_pequeno btn_vermelho" onClick={() => executar(confirmando)} disabled={enviando}
              autoFocus>
              {enviando ? 'Aguarde...' : `Sim, ${TEXTOS[confirmando].botao.toLowerCase()}`}
            </button>
          </div>
        </div>
      ) : (
        <div className="acoes">
          {podeEditar && <Link to={`/atividades/${atividade.id}/editar`} className="btn btn_pequeno btn_cinza">Editar</Link>}
          {disponiveis.map((acao) => (
            <button key={acao} type="button" className={`btn btn_pequeno ${TEXTOS[acao].classe}`}
              onClick={() => clicar(acao)} disabled={enviando}>
              {TEXTOS[acao].botao}
            </button>
          ))}
          {podeExcluir && (
            <button type="button" className="btn btn_pequeno btn_vermelho" onClick={() => clicar('excluir')} disabled={enviando}>
              Excluir
            </button>
          )}
        </div>
      )}
    </section>
  )
}

export default AcoesOrganizador
