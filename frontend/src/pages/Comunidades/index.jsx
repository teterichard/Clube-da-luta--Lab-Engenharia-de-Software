import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './style.css'

import Aviso from '../../components/Aviso'
import { listarComunidades } from '../../services/api'

const SITUACAO = {
  ATIVO: { texto: 'Você participa', classe: 'tag_verde' },
  PENDENTE: { texto: 'Pedido enviado', classe: 'tag_amarela' },
}

function CartaoComunidade({ c }) {
  const situacao = SITUACAO[c.meuStatus]
  return (
    <li>
      <Link to={`/comunidades/${c.id}`} className="comunidade-cartao">
        <span className="comunidade-icone" aria-hidden="true">{c.nome.slice(0, 1).toUpperCase()}</span>
        <span className="comunidade-corpo">
          <strong>{c.nome}</strong>
          <span className="comunidade-desc">{c.descricao}</span>
          <span className="comunidade-meta">
            {c.totalMembros} membro{c.totalMembros === 1 ? '' : 's'}
            {c.visibilidade === 'PRIVADA' && ' · privada'}
          </span>
        </span>
        {situacao && <span className={`tag ${situacao.classe}`}>{situacao.texto}</span>}
      </Link>
    </li>
  )
}

// Comunidades de interesse (wiki 2.3 — "seguir comunidades"; persona Ângela)
function Comunidades() {
  const [busca, setBusca] = useState('')
  const [lista, setLista] = useState(null)
  const [erro, setErro] = useState('')

  // espera a pessoa parar de digitar antes de buscar
  useEffect(() => {
    const timer = setTimeout(() => {
      listarComunidades(busca).then((r) => { setLista(r); setErro('') }).catch((e) => setErro(e.message))
    }, 250)
    return () => clearTimeout(timer)
  }, [busca])

  const minhas = (lista || []).filter((c) => c.meuStatus)
  const outras = (lista || []).filter((c) => !c.meuStatus)

  return (
    <main id="conteudo" className="pagina">
      <div className="pagina-topo">
        <div>
          <h1 className="pagina-titulo">Comunidades</h1>
          <p className="pagina-subtitulo">Encontre gente com os mesmos interesses que você.</p>
        </div>
        <Link to="/comunidades/nova" className="btn btn_pequeno">+ Criar comunidade</Link>
      </div>

      <div className="painel">
        <label htmlFor="busca-comunidade" className="sr-only">Buscar comunidades</label>
        <input id="busca-comunidade" className="busca-comunidade" type="search" placeholder="Buscar por nome ou assunto..."
          value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      <Aviso tipo="erro">{erro}</Aviso>
      {!lista && !erro && <p className="vazio" role="status">Carregando...</p>}

      {lista && (
        <>
          {minhas.length > 0 && (
            <section className="painel" aria-labelledby="titulo-minhas">
              <h2 id="titulo-minhas" className="secao-titulo">Suas comunidades</h2>
              <ul className="lista-cartoes">{minhas.map((c) => <CartaoComunidade key={c.id} c={c} />)}</ul>
            </section>
          )}
          <section className="painel" aria-labelledby="titulo-descobrir">
            <h2 id="titulo-descobrir" className="secao-titulo">{busca.trim() ? 'Resultados' : 'Descobrir'}</h2>
            {outras.length === 0 ? (
              <p className="vazio">
                {busca.trim() ? 'Nenhuma comunidade encontrada. Que tal criar uma?' : 'Você já está em todas as comunidades por aqui!'}
              </p>
            ) : (
              <ul className="lista-cartoes">{outras.map((c) => <CartaoComunidade key={c.id} c={c} />)}</ul>
            )}
          </section>
        </>
      )}
    </main>
  )
}

export default Comunidades
