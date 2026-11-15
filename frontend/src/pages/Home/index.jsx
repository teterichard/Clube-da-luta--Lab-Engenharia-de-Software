import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './style.css'

import Card from '../../components/Card'
import Carousel from '../../components/Carousel'
import Aviso from '../../components/Aviso'
import { listarAtividades } from '../../services/api'
import { imagemDoTipo, formatarData } from '../../utils/atividade'
import { MINHAS_INSCRICOES, SUGESTOES } from '../../data/exemplos'

// Tela 1 (wireframe 4.1): inscrições do usuário + sugestões de eventos
function Home() {
  const navigate = useNavigate()
  const [sugestoes, setSugestoes] = useState([])
  const [usandoExemplos, setUsandoExemplos] = useState(false)

  useEffect(() => {
    listarAtividades({ comVaga: true })
      .then((lista) => setSugestoes(lista))
      .catch(() => {
        // sem back-end (ou sem token): mostra os exemplos para a tela não ficar vazia
        setSugestoes(SUGESTOES)
        setUsandoExemplos(true)
      })
  }, [])

  function abrir(atividade) {
    if (String(atividade.id).startsWith('ex')) return // exemplo não tem página
    navigate(`/atividades/${atividade.id}`)
  }

  return (
    <main className="contentBox">
      <section className="subcontentBox">
        <Link to="/atividades/nova" className="home-criar">
          <span>
            <strong>Organize uma atividade</strong>
            <small>Chame a galera para jogar, correr ou dançar</small>
          </span>
          <span className="home-criar-mais">+</span>
        </Link>
      </section>

      <section className="subcontentBox">
        <h3 className="contentTitle">Suas inscrições </h3>
        <Carousel>
          {MINHAS_INSCRICOES.map((a) => (
            <Card key={a.id} titulo={a.titulo} asset={imagemDoTipo(a.tipo)} desc={a.descricao} btn_txt="Ver Detalhes" />
          ))}
        </Carousel>
      </section>

      <section className="subcontentBox">
        <h3 className="contentTitle">Sugestão de novos eventos </h3>
        {usandoExemplos && (
          <Aviso tipo="info">Back-end offline ou sem login: mostrando eventos de exemplo.</Aviso>
        )}
        {!usandoExemplos && sugestoes.length === 0 && (
          <p className="vazio">Nenhum evento com vagas por enquanto. Que tal criar um?</p>
        )}
        <Carousel>
          {sugestoes.map((a) => (
            <Card
              key={a.id}
              titulo={a.titulo}
              asset={imagemDoTipo(a.tipo)}
              desc={a.descricao || `${a.local}`}
              info={a.dataHora ? `${formatarData(a.dataHora)} · ${a.vagas} vagas` : null}
              btn_txt="Inscreva-se"
              btn_type="focused"
              onClick={() => abrir(a)}
            />
          ))}
        </Carousel>
      </section>
    </main>
  )
}

export default Home
