import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import '../Comunidades/style.css'

import Aviso from '../../components/Aviso'
import { useAuth } from '../../contexts/AuthContext'
import {
  buscarComunidade,
  entrarNaComunidade,
  gerenciarMembro,
  listarMembros,
  sairDaComunidade,
} from '../../services/api'

function DetalhesComunidade() {
  const { id } = useParams()
  const location = useLocation()
  const { usuario } = useAuth()

  const [comunidade, setComunidade] = useState(null)
  const [membros, setMembros] = useState(null)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState(location.state?.mensagem || '')
  const [enviando, setEnviando] = useState(false)
  const [confirmandoSaida, setConfirmandoSaida] = useState(false)

  async function carregar() {
    const c = await buscarComunidade(id)
    setComunidade(c)
    // privada: só membros veem a lista (a API responde 403 para os demais)
    if (c.visibilidade === 'PUBLICA' || c.meuStatus === 'ATIVO') setMembros(await listarMembros(id))
    else setMembros(null)
  }

  useEffect(() => {
    carregar().catch((e) => setErro(e.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function agir(fn, sucesso) {
    setEnviando(true)
    setErro('')
    setMensagem('')
    try {
      await fn()
      await carregar()
      setMensagem(sucesso)
      setConfirmandoSaida(false)
    } catch (e) {
      setErro(e.message)
    } finally {
      setEnviando(false)
    }
  }

  if (!comunidade) {
    return (
      <main id="conteudo" className="pagina">
        <Link to="/comunidades" className="voltar">← Voltar para comunidades</Link>
        <Aviso tipo="erro">{erro}</Aviso>
        {!erro && <p className="vazio" role="status">Carregando...</p>}
      </main>
    )
  }

  const souAdmin = comunidade.meuPapel === 'ADMIN' && comunidade.meuStatus === 'ATIVO'
  const pendentes = (membros || []).filter((m) => m.status === 'PENDENTE')
  const ativos = (membros || []).filter((m) => m.status === 'ATIVO')

  return (
    <main id="conteudo" className="pagina">
      <Link to="/comunidades" className="voltar">← Voltar para comunidades</Link>
      <Aviso tipo="sucesso">{mensagem}</Aviso>
      <Aviso tipo="erro">{erro}</Aviso>

      <article className="painel detalhe-comunidade">
        <div className="tags">
          <span className={`tag ${comunidade.visibilidade === 'PRIVADA' ? 'tag_amarela' : ''}`}>
            {comunidade.visibilidade === 'PRIVADA' ? 'Privada' : 'Pública'}
          </span>
          {souAdmin && <span className="tag tag_verde">Você administra</span>}
        </div>
        <h1 className="pagina-titulo">{comunidade.nome}</h1>
        <p className="detalhe-desc">{comunidade.descricao}</p>
        <p className="comunidade-meta">{comunidade.totalMembros} membro{comunidade.totalMembros === 1 ? '' : 's'}</p>

        <div className="acoes">
          {!comunidade.meuStatus && (
            <button className="btn" disabled={enviando} onClick={() => agir(() => entrarNaComunidade(id),
              comunidade.visibilidade === 'PUBLICA' ? 'Bem-vindo à comunidade!' : 'Pedido enviado! Um administrador vai responder.')}>
              {comunidade.visibilidade === 'PUBLICA' ? 'Entrar na comunidade' : 'Pedir para entrar'}
            </button>
          )}
          {comunidade.meuStatus === 'PENDENTE' && (
            <button className="btn btn_cinza" disabled={enviando}
              onClick={() => agir(() => sairDaComunidade(id), 'Pedido cancelado.')}>Cancelar pedido</button>
          )}
          {comunidade.meuStatus === 'ATIVO' && !confirmandoSaida && (
            <button className="btn btn_cinza btn_pequeno" onClick={() => setConfirmandoSaida(true)}>Sair da comunidade</button>
          )}
          {souAdmin && <Link to={`/comunidades/${id}/editar`} className="btn btn_cinza btn_pequeno">Editar</Link>}
        </div>

        {confirmandoSaida && (
          <div className="confirmacao" role="alertdialog" aria-labelledby="texto-sair">
            <p id="texto-sair">Sair de "{comunidade.nome}"?</p>
            <div className="acoes">
              <button className="btn btn_pequeno btn_cinza" onClick={() => setConfirmandoSaida(false)}>Voltar</button>
              <button className="btn btn_pequeno btn_vermelho" disabled={enviando} autoFocus
                onClick={() => agir(() => sairDaComunidade(id), 'Você saiu da comunidade.')}>Sim, sair</button>
            </div>
          </div>
        )}
      </article>

      {souAdmin && pendentes.length > 0 && (
        <section className="painel" aria-labelledby="titulo-pedidos">
          <h2 id="titulo-pedidos" className="secao-titulo">
            Pedidos para entrar <span className="contador">{pendentes.length}</span>
          </h2>
          <ul className="lista-cartoes">
            {pendentes.map((m) => (
              <li key={m.usuarioId} className="cartao-linha">
                <strong className="cartao-titulo">{m.usuario?.nome}</strong>
                <div className="acoes">
                  <button className="btn btn_pequeno btn_cinza" disabled={enviando} aria-label={`Recusar ${m.usuario?.nome}`}
                    onClick={() => agir(() => gerenciarMembro(id, m.usuarioId, { decisao: 'RECUSAR' }), 'Pedido recusado.')}>
                    Recusar
                  </button>
                  <button className="btn btn_pequeno" disabled={enviando} aria-label={`Aceitar ${m.usuario?.nome}`}
                    onClick={() => agir(() => gerenciarMembro(id, m.usuarioId, { decisao: 'ACEITAR' }), `${m.usuario?.nome} agora é membro.`)}>
                    Aceitar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="painel" aria-labelledby="titulo-membros">
        <h2 id="titulo-membros" className="secao-titulo">Membros</h2>
        {!membros ? (
          <p className="vazio">Entre na comunidade para ver quem participa.</p>
        ) : (
          <ul className="lista-cartoes">
            {ativos.map((m) => (
              <li key={m.usuarioId} className="cartao-linha">
                <span className="cartao-titulo">
                  {m.usuario?.nome}{String(m.usuarioId) === String(usuario.id) && ' (você)'}
                </span>
                {m.papel === 'ADMIN' ? (
                  <span className="tag tag_roxa">Admin</span>
                ) : souAdmin && (
                  <button className="btn btn_pequeno btn_cinza" disabled={enviando} aria-label={`Tornar ${m.usuario?.nome} administrador`}
                    onClick={() => agir(() => gerenciarMembro(id, m.usuarioId, { papel: 'ADMIN' }), `${m.usuario?.nome} agora é admin.`)}>
                    Tornar admin
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default DetalhesComunidade
