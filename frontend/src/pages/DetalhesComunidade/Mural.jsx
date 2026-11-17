import { useEffect, useRef, useState } from 'react'

import Aviso from '../../components/Aviso'
import { enviarMensagem, listarMensagens } from '../../services/api'

const quando = (data) => new Date(data).toLocaleString('pt-BR', {
  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
})

// RF17 — interação dentro da comunidade: mural de mensagens dos membros (atualiza a cada 15 s)
function Mural({ comunidadeId }) {
  const [mensagens, setMensagens] = useState(null)
  const [texto, setTexto] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const lista = useRef(null)

  useEffect(() => {
    let ativo = true
    const carregar = () => listarMensagens(comunidadeId)
      .then((m) => { if (ativo) setMensagens(m) })
      .catch((e) => { if (ativo) setErro(e.message) })
    carregar()
    const intervalo = setInterval(carregar, 15000)
    return () => { ativo = false; clearInterval(intervalo) }
  }, [comunidadeId])

  // rola para a mensagem mais recente
  useEffect(() => {
    if (lista.current) lista.current.scrollTop = lista.current.scrollHeight
  }, [mensagens])

  async function enviar(e) {
    e.preventDefault()
    if (!texto.trim()) return
    setErro('')
    setEnviando(true)
    try {
      const nova = await enviarMensagem(comunidadeId, texto.trim())
      setMensagens((atuais) => [...(atuais || []), nova])
      setTexto('')
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="painel" aria-labelledby="titulo-mural">
      <h2 id="titulo-mural" className="secao-titulo">Mural</h2>
      {mensagens === null && !erro && <p className="vazio" role="status">Carregando...</p>}
      {mensagens && mensagens.length === 0 && <p className="vazio">Nenhuma mensagem ainda. Puxe o assunto!</p>}
      {mensagens && mensagens.length > 0 && (
        <ul className="mural" ref={lista} aria-live="polite">
          {mensagens.map((m) => (
            <li key={m.id} className="mural-msg">
              <div className="mural-topo">
                <strong>{m.autor?.nome || 'Alguém'}</strong>
                <span>{quando(m.enviadaEm)}</span>
              </div>
              <p>{m.conteudo}</p>
            </li>
          ))}
        </ul>
      )}
      <Aviso tipo="erro">{erro}</Aviso>
      <form className="mural-form" onSubmit={enviar}>
        <label htmlFor="mensagem-mural" className="sr-only">Mensagem para o mural</label>
        <input id="mensagem-mural" value={texto} maxLength={500} placeholder="Escreva uma mensagem..."
          onChange={(e) => setTexto(e.target.value)} />
        <button className="btn btn_pequeno" type="submit" disabled={enviando || !texto.trim()}>Enviar</button>
      </form>
    </section>
  )
}

export default Mural
