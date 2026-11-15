import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import Aviso from '../../components/Aviso'
import FormComunidade from '../../components/FormComunidade'
import { buscarComunidade, editarComunidade } from '../../services/api'

function EditarComunidade() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [inicial, setInicial] = useState(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    buscarComunidade(id)
      .then((c) => {
        if (c.meuPapel !== 'ADMIN') setErro('Somente administradores podem editar a comunidade.')
        else setInicial({ nome: c.nome, descricao: c.descricao, visibilidade: c.visibilidade })
      })
      .catch((e) => setErro(e.message))
  }, [id])

  async function salvar(dados) {
    setErro('')
    try {
      await editarComunidade(id, dados)
      navigate(`/comunidades/${id}`, { state: { mensagem: 'Comunidade atualizada.' } })
    } catch (e) {
      setErro(e.message)
      throw e
    }
  }

  return (
    <main id="conteudo" className="pagina">
      <Link to={`/comunidades/${id}`} className="voltar">← Voltar</Link>
      <h1 className="pagina-titulo">Editar comunidade</h1>
      <Aviso tipo="erro">{erro}</Aviso>
      {!erro && !inicial && <p className="vazio" role="status">Carregando...</p>}
      {inicial && <FormComunidade inicial={inicial} textoBotao="Salvar alterações" onEnviar={salvar} />}
    </main>
  )
}

export default EditarComunidade
