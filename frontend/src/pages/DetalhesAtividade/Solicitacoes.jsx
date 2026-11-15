import { useEffect, useState } from 'react'

import Aviso from '../../components/Aviso'
import { listarSolicitacoes, responderSolicitacao } from '../../services/api'

const STATUS = {
  PENDENTE: { texto: 'Pendente', classe: 'tag_amarela' },
  ACEITO: { texto: 'Aceito', classe: 'tag_verde' },
  REJEITADO: { texto: 'Recusado', classe: 'tag_vermelha' },
}

// Passo 7 do UC "Inscrever-se em atividade": organizador aceita ou recusa (CT-01 / CT-05)
function Solicitacoes({ atividadeId, onAtualizar }) {
  const [lista, setLista] = useState([])
  const [erro, setErro] = useState('')

  function carregar() {
    listarSolicitacoes(atividadeId)
      .then(setLista)
      .catch((e) => setErro(e.message))
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atividadeId])

  async function responder(id, decisao) {
    setErro('')
    try {
      await responderSolicitacao(id, decisao)
      carregar()
      onAtualizar() // atualiza as vagas lá em cima
    } catch (e) {
      setErro(e.message)
    }
  }

  const pendentes = lista.filter((s) => s.status === 'PENDENTE').length

  return (
    <section className="painel">
      <h3 className="secao-titulo">
        Solicitações {pendentes > 0 && <span className="contador">{pendentes}</span>}
      </h3>
      <Aviso tipo="erro">{erro}</Aviso>

      {lista.length === 0 && <p className="vazio">Ninguém pediu para participar ainda.</p>}

      <ul className="solicitacoes">
        {lista.map((s) => (
          <li key={s.id} className="solicitacao">
            <div className="avatar">{String(s.usuarioId).slice(0, 2)}</div>
            <div className="solicitacao-info">
              <strong>Usuário #{s.usuarioId}</strong>
              <span>pediu em {new Date(s.solicitadaEm).toLocaleDateString('pt-BR')}</span>
            </div>

            {s.status === 'PENDENTE' ? (
              <div className="solicitacao-acoes">
                <button className="btn btn_pequeno btn_cinza" onClick={() => responder(s.id, 'RECUSAR')}>Recusar</button>
                <button className="btn btn_pequeno" onClick={() => responder(s.id, 'ACEITAR')}>Aceitar</button>
              </div>
            ) : (
              <span className={`tag ${STATUS[s.status].classe}`}>{STATUS[s.status].texto}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default Solicitacoes
