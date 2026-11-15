import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './style.css'

import Card from '../../components/Card'
import Carousel from '../../components/Carousel'
import Aviso from '../../components/Aviso'
import Tag from '../../components/Tag'
import {
  listarAtividades,
  listarAtividadesOrganizadas,
  listarConvitesRecebidos,
  listarMinhasInscricoes,
} from '../../services/api'
import { imagemDoTipo, formatarData } from '../../utils/atividade'
import { STATUS_PARTICIPACAO } from '../../utils/status'

const EM_ANDAMENTO = ['AGENDADA', 'ATIVA']

// Tela 1 (wireframe 4.1): inscrições do usuário, atividades que organiza e sugestões de eventos
function Home() {
  const navigate = useNavigate()
  const location = useLocation()
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    Promise.all([
      listarMinhasInscricoes(),
      listarAtividadesOrganizadas(),
      listarAtividades({ comVaga: true }),
      listarConvitesRecebidos('PENDENTE'),
    ])
      .then(([inscricoes, organizadas, abertas, convites]) => {
        const ativas = inscricoes.filter((p) => ['PENDENTE', 'ACEITO'].includes(p.status)
          && EM_ANDAMENTO.includes(p.atividade.status))
        const ocupadas = new Set([...ativas.map((p) => p.atividadeId), ...organizadas.map((a) => a.id)])
        setDados({
          inscricoes: ativas,
          organizadas: organizadas.filter((a) => EM_ANDAMENTO.includes(a.status)),
          sugestoes: abertas.filter((a) => !ocupadas.has(a.id)),
          convites,
        })
      })
      .catch((e) => setErro(e.message))
  }, [])

  const abrir = (atividadeId) => navigate(`/atividades/${atividadeId}`)

  return (
    <main id="conteudo" className="contentBox">
      <h1 className="sr-only">Início</h1>
      <Aviso tipo="sucesso">{location.state?.mensagem}</Aviso>

      <section className="subcontentBox">
        <Link to="/atividades/nova" className="home-criar">
          <span>
            <strong>Organize uma atividade</strong>
            <small>Chame a galera para jogar, correr ou dançar</small>
          </span>
          <span className="home-criar-mais" aria-hidden="true">+</span>
        </Link>
      </section>

      <Aviso tipo="erro">{erro}</Aviso>
      {!dados && !erro && <p className="vazio" role="status">Carregando...</p>}

      {dados && (
        <>
          {dados.convites.length > 0 && (
            <Link to="/convites" className="home-aviso-convite">
              Você tem {dados.convites.length} convite{dados.convites.length > 1 ? 's' : ''} esperando resposta →
            </Link>
          )}

          <section className="subcontentBox" aria-labelledby="titulo-inscricoes">
            <h2 id="titulo-inscricoes" className="contentTitle">Suas inscrições</h2>
            {dados.inscricoes.length === 0 ? (
              <p className="vazio">Você ainda não se inscreveu em nada. <Link to="/busca">Encontre uma atividade</Link></p>
            ) : (
              <Carousel>
                {dados.inscricoes.map((p) => (
                  <Card key={p.id} titulo={p.atividade.titulo} asset={imagemDoTipo(p.atividade.tipo)}
                    selo={<Tag mapa={STATUS_PARTICIPACAO} status={p.status} />}
                    info={`${formatarData(p.atividade.dataHora)} · ${p.atividade.local}`}
                    btn_txt="Ver Detalhes" onClick={() => abrir(p.atividadeId)} />
                ))}
              </Carousel>
            )}
          </section>

          {dados.organizadas.length > 0 && (
            <section className="subcontentBox" aria-labelledby="titulo-organizadas">
              <h2 id="titulo-organizadas" className="contentTitle">Atividades que você organiza</h2>
              <Carousel>
                {dados.organizadas.map((a) => (
                  <Card key={a.id} titulo={a.titulo} asset={imagemDoTipo(a.tipo)}
                    selo={a.pendentes > 0
                      ? <span className="tag tag_amarela">{a.pendentes} pedido{a.pendentes > 1 ? 's' : ''} para responder</span>
                      : null}
                    info={`${formatarData(a.dataHora)} · ${a.vagas} vagas`}
                    btn_txt="Gerenciar" btn_type="focused" onClick={() => abrir(a.id)} />
                ))}
              </Carousel>
            </section>
          )}

          <section className="subcontentBox" aria-labelledby="titulo-sugestoes">
            <h2 id="titulo-sugestoes" className="contentTitle">Sugestão de novos eventos</h2>
            {dados.sugestoes.length === 0 ? (
              <p className="vazio">Nenhum evento com vagas por enquanto. Que tal criar um?</p>
            ) : (
              <Carousel>
                {dados.sugestoes.map((a) => (
                  <Card key={a.id} titulo={a.titulo} asset={imagemDoTipo(a.tipo)} desc={a.descricao || a.local}
                    info={`${formatarData(a.dataHora)} · ${a.vagas} vagas`}
                    btn_txt="Inscreva-se" btn_type="focused" onClick={() => abrir(a.id)} />
                ))}
              </Carousel>
            )}
          </section>
        </>
      )}
    </main>
  )
}

export default Home
