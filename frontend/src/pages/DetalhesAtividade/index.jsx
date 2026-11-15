import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import './style.css'

import Aviso from '../../components/Aviso'
import Tag from '../../components/Tag'
import Solicitacoes from './Solicitacoes'
import Convites from './Convites'
import AcoesOrganizador from './AcoesOrganizador'
import MinhaParticipacao from './MinhaParticipacao'
import { buscarAtividade } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { imagemDoTipo, formatarData, textoDaLista, TIPOS, NIVEIS, PUBLICOS } from '../../utils/atividade'
import { STATUS_ATIVIDADE } from '../../utils/status'

// UC "Inscrever-se em atividade" — passo 5 (ver detalhes e vagas) e ações de participante e organizador
function DetalhesAtividade() {
  const { id } = useParams()
  const location = useLocation()
  const { usuario } = useAuth()

  const [atividade, setAtividade] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  function carregar() {
    return buscarAtividade(id)
      .then(setAtividade)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false))
  }

  useEffect(() => {
    setCarregando(true)
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (carregando) return <main id="conteudo" className="pagina"><p className="vazio" role="status">Carregando...</p></main>

  if (erro) {
    return (
      <main id="conteudo" className="pagina">
        <Link to="/busca" className="voltar">← Voltar para a busca</Link>
        <Aviso tipo="erro">{erro}</Aviso>
      </main>
    )
  }

  const souOrganizador = String(usuario.id) === String(atividade.organizadorId)
  const ocupadas = atividade.numeroIntegrantes - atividade.vagas
  const porcentagem = Math.round((ocupadas / atividade.numeroIntegrantes) * 100)

  return (
    <main id="conteudo" className="pagina">
      <Link to={souOrganizador ? '/' : '/busca'} className="voltar">← Voltar</Link>

      <Aviso tipo="sucesso">{location.state?.mensagem}</Aviso>

      <article className="painel detalhe">
        <img className="detalhe-img" src={imagemDoTipo(atividade.tipo)} alt="" />

        <div className="tags">
          {atividade.status !== 'AGENDADA' && <Tag mapa={STATUS_ATIVIDADE} status={atividade.status} />}
          <span className="tag tag_roxa">{textoDaLista(TIPOS, atividade.tipo)}</span>
          <span className="tag">{textoDaLista(NIVEIS, atividade.nivel)}</span>
          <span className="tag">{textoDaLista(PUBLICOS, atividade.publicoAlvo)}</span>
          {atividade.visibilidade === 'PRIVADA' && <span className="tag tag_amarela">Privada</span>}
          {souOrganizador && <span className="tag tag_verde">Você organiza</span>}
        </div>

        <h1 className="pagina-titulo">{atividade.titulo}</h1>
        {atividade.descricao && <p className="detalhe-desc">{atividade.descricao}</p>}

        <ul className="detalhe-infos">
          <li><span aria-hidden="true">📅</span> {formatarData(atividade.dataHora)}</li>
          <li><span aria-hidden="true">📍</span> {atividade.local}</li>
          <li><span aria-hidden="true">👥</span> {atividade.numeroIntegrantes} integrantes</li>
        </ul>

        <div className="vagas">
          <div className="vagas-texto">
            <strong>{atividade.vagas > 0 ? `${atividade.vagas} vagas restantes` : 'Sem vagas'}</strong>
            <span>{ocupadas}/{atividade.numeroIntegrantes} confirmados</span>
          </div>
          <div className="vagas-barra" role="progressbar" aria-label="Vagas preenchidas"
            aria-valuemin={0} aria-valuemax={atividade.numeroIntegrantes} aria-valuenow={ocupadas}>
            <div className="vagas-preenchido" style={{ width: `${porcentagem}%` }}></div>
          </div>
        </div>

        {!souOrganizador && <MinhaParticipacao atividade={atividade} onAtualizar={carregar} />}
      </article>

      {souOrganizador && (
        <>
          <AcoesOrganizador atividade={atividade} onAtualizar={setAtividade} />
          <Solicitacoes atividade={atividade} onAtualizar={carregar} />
          <Convites atividade={atividade} />
        </>
      )}
    </main>
  )
}

export default DetalhesAtividade
