import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import './style.css'

import Aviso from '../../components/Aviso'
import Solicitacoes from './Solicitacoes'
import { buscarAtividade, solicitarParticipacao, getUsuarioLogado } from '../../services/api'
import { imagemDoTipo, formatarData, textoDaLista, TIPOS, NIVEIS, PUBLICOS } from '../../utils/atividade'

// UC "Inscrever-se em atividade" — passos 5 (ver detalhes e vagas) e 6 (solicitar participação)
function DetalhesAtividade() {
  const { id } = useParams()
  const location = useLocation()
  const usuario = getUsuarioLogado()

  const [atividade, setAtividade] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState(location.state?.criada ? 'Atividade criada com sucesso!' : '')
  const [erroInscricao, setErroInscricao] = useState('')
  const [enviando, setEnviando] = useState(false)

  function carregar() {
    return buscarAtividade(id)
      .then(setAtividade)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false))
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function inscrever() {
    setEnviando(true)
    setErroInscricao('')
    setMensagem('')
    try {
      await solicitarParticipacao(id)
      setMensagem('Solicitação enviada! Agora é só aguardar o organizador aceitar.')
    } catch (e) {
      // 409: sem vagas, já solicitou, atividade já começou...
      setErroInscricao(e.message)
    } finally {
      setEnviando(false)
    }
  }

  if (carregando) return <main className="pagina"><p className="vazio">Carregando...</p></main>

  if (erro) {
    return (
      <main className="pagina">
        <Link to="/busca" className="voltar">← Voltar para a busca</Link>
        <Aviso tipo="erro">{erro}</Aviso>
      </main>
    )
  }

  const souOrganizador = usuario && String(usuario.id) === String(atividade.organizadorId)
  const ocupadas = atividade.numeroIntegrantes - atividade.vagas
  const porcentagem = Math.round((ocupadas / atividade.numeroIntegrantes) * 100)

  return (
    <main className="pagina">
      <Link to="/busca" className="voltar">← Voltar para a busca</Link>

      <Aviso tipo="sucesso">{mensagem}</Aviso>

      <div className="painel detalhe">
        <img className="detalhe-img" src={imagemDoTipo(atividade.tipo)} alt={atividade.titulo} />

        <div className="tags">
          <span className="tag tag_roxa">{textoDaLista(TIPOS, atividade.tipo)}</span>
          <span className="tag">{textoDaLista(NIVEIS, atividade.nivel)}</span>
          <span className="tag">{textoDaLista(PUBLICOS, atividade.publicoAlvo)}</span>
          {atividade.visibilidade === 'PRIVADA' && <span className="tag tag_amarela">Privada</span>}
        </div>

        <h2 className="pagina-titulo">{atividade.titulo}</h2>
        {atividade.descricao && <p className="detalhe-desc">{atividade.descricao}</p>}

        <ul className="detalhe-infos">
          <li><span>📅</span> {formatarData(atividade.dataHora)}</li>
          <li><span>📍</span> {atividade.local}</li>
          <li><span>👥</span> {atividade.numeroIntegrantes} integrantes</li>
        </ul>

        <div className="vagas">
          <div className="vagas-texto">
            <strong>{atividade.vagas > 0 ? `${atividade.vagas} vagas restantes` : 'Sem vagas'}</strong>
            <span>{ocupadas}/{atividade.numeroIntegrantes} confirmados</span>
          </div>
          <div className="vagas-barra">
            <div className="vagas-preenchido" style={{ width: `${porcentagem}%` }}></div>
          </div>
        </div>

        {!souOrganizador && (
          <>
            <Aviso tipo="erro">{erroInscricao}</Aviso>
            <button className="btn detalhe-btn" onClick={inscrever} disabled={enviando || atividade.vagas === 0}>
              {atividade.vagas === 0 ? 'Atividade lotada' : enviando ? 'Enviando...' : 'Solicitar participação'}
            </button>
          </>
        )}
      </div>

      {/* passo 7: só o organizador vê e responde as solicitações */}
      {souOrganizador && <Solicitacoes atividadeId={atividade.id} onAtualizar={carregar} />}
    </main>
  )
}

export default DetalhesAtividade
