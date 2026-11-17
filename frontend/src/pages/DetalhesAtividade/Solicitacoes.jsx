import { useEffect, useState } from 'react'

import Aviso from '../../components/Aviso'
import { listarSolicitacoes, responderSolicitacao, avaliarParticipante } from '../../services/api'
import Tag from '../../components/Tag'
import Estrelas from '../../components/Estrelas'
import { STATUS_SOLICITACAO } from '../../utils/status'

// Passo 7 do UC "Inscrever-se em atividade": organizador aceita ou recusa (CT-01 / CT-05)
function Solicitacoes({ atividade, onAtualizar }) {
  const [lista, setLista] = useState([])
  const [erro, setErro] = useState('')
  const [respondendo, setRespondendo] = useState(null)

  function carregar() {
    listarSolicitacoes(atividade.id)
      .then(setLista)
      .catch((e) => setErro(e.message))
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atividade.id, atividade.vagas])

  async function responder(id, decisao) {
    setErro('')
    setRespondendo(id)
    try {
      await responderSolicitacao(id, decisao)
      carregar()
      onAtualizar() // atualiza as vagas lá em cima
    } catch (e) {
      setErro(e.message)
    } finally {
      setRespondendo(null)
    }
  }

  // RF14: depois de concluída, o organizador dá uma nota para cada participante confirmado
  async function avaliar(usuarioId, nota) {
    setErro('')
    setRespondendo(usuarioId)
    try {
      await avaliarParticipante(atividade.id, usuarioId, nota)
      carregar()
    } catch (e) {
      setErro(e.message)
    } finally {
      setRespondendo(null)
    }
  }

  const pendentes = lista.filter((s) => s.status === 'PENDENTE').length
  const podeResponder = atividade.status === 'AGENDADA'
  const concluida = atividade.status === 'CONCLUIDA'

  return (
    <section className="painel" aria-labelledby="titulo-solicitacoes">
      <h2 id="titulo-solicitacoes" className="secao-titulo">
        Participantes e solicitações
        {pendentes > 0 && <span className="contador" aria-label={`${pendentes} pendentes`}>{pendentes}</span>}
      </h2>
      {concluida && lista.some((s) => s.status === 'ACEITO' && !s.notaDoOrganizador) && (
        <p className="secao-texto">Atividade concluída: dê uma nota para cada participante confirmado.</p>
      )}
      <Aviso tipo="erro">{erro}</Aviso>

      {lista.length === 0 && <p className="vazio">Ninguém pediu para participar ainda.</p>}

      <ul className="solicitacoes">
        {lista.map((s) => {
          const nome = s.usuario?.nome || `Usuário #${s.usuarioId}`
          return (
            <li key={s.id} className="solicitacao">
              <div className="avatar" aria-hidden="true">{nome.slice(0, 2).toUpperCase()}</div>
              <div className="solicitacao-info">
                <strong>{nome}</strong>
                <span>pediu em {new Date(s.solicitadaEm).toLocaleDateString('pt-BR')}</span>
              </div>

              {concluida && s.status === 'ACEITO' ? (
                s.notaDoOrganizador
                  ? <Estrelas nota={s.notaDoOrganizador} />
                  : <Estrelas onEscolher={(nota) => avaliar(s.usuarioId, nota)} rotulo={`Nota para ${nome}`}
                    desabilitado={respondendo === s.usuarioId} />
              ) : s.status === 'PENDENTE' && podeResponder ? (
                <div className="solicitacao-acoes">
                  <button className="btn btn_pequeno btn_cinza" onClick={() => responder(s.id, 'RECUSAR')}
                    disabled={respondendo === s.id} aria-label={`Recusar ${nome}`}>Recusar</button>
                  <button className="btn btn_pequeno" onClick={() => responder(s.id, 'ACEITAR')}
                    disabled={respondendo === s.id || atividade.vagas === 0} aria-label={`Aceitar ${nome}`}>Aceitar</button>
                </div>
              ) : (
                <Tag mapa={STATUS_SOLICITACAO} status={s.status} />
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default Solicitacoes
