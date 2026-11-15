import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import Aviso from '../../components/Aviso'
import FormComunidade from '../../components/FormComunidade'
import { criarComunidade } from '../../services/api'

function CriarComunidade() {
  const navigate = useNavigate()
  const [erro, setErro] = useState('')

  async function criar(dados) {
    setErro('')
    try {
      const comunidade = await criarComunidade(dados)
      navigate(`/comunidades/${comunidade.id}`, { state: { mensagem: 'Comunidade criada! Você é o administrador.' } })
    } catch (e) {
      setErro(e.message)
      throw e
    }
  }

  return (
    <main id="conteudo" className="pagina">
      <Link to="/comunidades" className="voltar">← Voltar para comunidades</Link>
      <h1 className="pagina-titulo">Criar comunidade</h1>
      <p className="pagina-subtitulo">Junte quem curte a mesma coisa que você.</p>
      <Aviso tipo="erro">{erro}</Aviso>
      <FormComunidade textoBotao="Criar comunidade" onEnviar={criar} />
    </main>
  )
}

export default CriarComunidade
