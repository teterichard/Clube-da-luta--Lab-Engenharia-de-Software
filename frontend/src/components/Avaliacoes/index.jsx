import { useEffect, useState } from 'react'

import Aviso from '../Aviso'
import Campo from '../Campo'
import Estrelas from '../Estrelas'

const dia = (data) => new Date(data).toLocaleDateString('pt-BR')

// Média + lista de avaliações + formulário (RF12/RF13 para atividade, RF18 para comunidade).
// carregar() e enviar(nota, comentario) vêm de fora; podeAvaliar(dados) diz se o formulário aparece
// e aviso(dados) mostra uma explicação quando ainda não dá para avaliar.
function Avaliacoes({ titulo = 'Avaliações', idSecao, carregar, enviar, podeAvaliar, aviso }) {
  const [dados, setDados] = useState(null)
  const [nota, setNota] = useState(0)
  const [comentario, setComentario] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  function atualizar() {
    return carregar().then(setDados).catch((e) => setErro(e.message))
  }

  useEffect(() => {
    atualizar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function avaliar(e) {
    e.preventDefault()
    setErro('')
    if (!nota) {
      setErro('Escolha de 1 a 5 estrelas')
      return
    }
    setEnviando(true)
    try {
      await enviar(nota, comentario.trim())
      setNota(0)
      setComentario('')
      await atualizar()
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  const tituloId = `${idSecao}-titulo`

  return (
    <section className="painel" aria-labelledby={tituloId}>
      <h2 id={tituloId} className="secao-titulo">
        {titulo}
        {dados && dados.total > 0 && (
          <span className="media-avaliacoes"><Estrelas nota={dados.media} /> {dados.media} ({dados.total})</span>
        )}
      </h2>

      {!dados && !erro && <p className="vazio" role="status">Carregando...</p>}

      {dados && (
        <>
          {aviso && aviso(dados)}
          {dados.minhaAvaliacao && (
            <p className="secao-texto">
              Você deu {dados.minhaAvaliacao.nota} estrela{dados.minhaAvaliacao.nota === 1 ? '' : 's'}. Obrigado!
            </p>
          )}

          {podeAvaliar(dados) && !dados.minhaAvaliacao && (
            <form className="form form-avaliar" onSubmit={avaliar} noValidate>
              <Estrelas nota={nota} onEscolher={setNota} grande rotulo="Sua nota" desabilitado={enviando} />
              <Campo nome={`${idSecao}-comentario`} label="Comentário (opcional)" dica={`${comentario.length}/500`}>
                <textarea id={`${idSecao}-comentario`} value={comentario} maxLength={500} placeholder="Conte como foi"
                  onChange={(e) => setComentario(e.target.value)} />
              </Campo>
              <button className="btn btn_pequeno" type="submit" disabled={enviando}>
                {enviando ? 'Enviando...' : 'Enviar avaliação'}
              </button>
            </form>
          )}

          {dados.total === 0 && <p className="vazio">Ainda sem avaliações.</p>}
          <ul className="lista-avaliacoes">
            {dados.avaliacoes.map((a) => (
              <li key={a.id} className="avaliacao">
                <div className="avaliacao-topo">
                  <strong>{a.autor?.nome || 'Alguém'}</strong>
                  <Estrelas nota={a.nota} />
                  <span className="avaliacao-data">{dia(a.criadaEm)}</span>
                </div>
                {a.comentario && <p>{a.comentario}</p>}
              </li>
            ))}
          </ul>
        </>
      )}
      <Aviso tipo="erro">{erro}</Aviso>
    </section>
  )
}

export default Avaliacoes
