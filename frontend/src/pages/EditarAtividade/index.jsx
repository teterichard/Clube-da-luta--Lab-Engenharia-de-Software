import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import Aviso from '../../components/Aviso'
import FormAtividade from '../../components/FormAtividade'
import { paraFormulario } from '../../components/FormAtividade/paraFormulario'
import { buscarAtividade, editarAtividade } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

// RF04 — organizador edita a atividade enquanto ela está agendada
function EditarAtividade() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = useAuth()

  const [inicial, setInicial] = useState(null)
  const [erro, setErro] = useState('')
  const [erroGeral, setErroGeral] = useState('')

  useEffect(() => {
    buscarAtividade(id)
      .then((a) => {
        if (String(a.organizadorId) !== String(usuario.id)) setErro('Somente o organizador pode editar esta atividade.')
        else if (a.status !== 'AGENDADA') setErro('Só é possível editar uma atividade agendada.')
        else setInicial(paraFormulario(a))
      })
      .catch((e) => setErro(e.message))
  }, [id, usuario.id])

  async function salvar(dados) {
    setErroGeral('')
    try {
      await editarAtividade(id, dados)
      navigate(`/atividades/${id}`, { state: { mensagem: 'Alterações salvas! Quem vai participar foi avisado.' } })
    } catch (e) {
      setErroGeral(e.message)
      throw e
    }
  }

  return (
    <main id="conteudo" className="pagina">
      <Link to={`/atividades/${id}`} className="voltar">← Voltar para a atividade</Link>
      <h1 className="pagina-titulo">Editar atividade</h1>

      <Aviso tipo="erro">{erro || erroGeral}</Aviso>
      {!erro && !inicial && <p className="vazio" role="status">Carregando...</p>}
      {inicial && (
        <FormAtividade inicial={inicial} textoBotao="Salvar alterações" textoEnviando="Salvando..." onEnviar={salvar} />
      )}
    </main>
  )
}

export default EditarAtividade
