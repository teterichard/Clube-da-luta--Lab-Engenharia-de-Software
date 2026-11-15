import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import Aviso from '../../components/Aviso'
import FormAtividade from '../../components/FormAtividade'
import { criarAtividade } from '../../services/api'

// UC "Criar atividade" (seção 5.2 do documento / docs/plano-acao-criar-atividade.md)
function CriarAtividade() {
  const navigate = useNavigate()
  const [erroGeral, setErroGeral] = useState('')

  async function criar(dados) {
    setErroGeral('')
    try {
      const atividade = await criarAtividade(dados)
      navigate(`/atividades/${atividade.id}`, { state: { mensagem: 'Atividade criada com sucesso!' } })
    } catch (erro) {
      setErroGeral(erro.message)
      throw erro
    }
  }

  return (
    <main id="conteudo" className="pagina">
      <Link to="/" className="voltar">← Voltar</Link>
      <h1 className="pagina-titulo">Criar atividade</h1>
      <p className="pagina-subtitulo">Preencha os dados e convide a galera para participar.</p>

      <Aviso tipo="erro">{erroGeral}</Aviso>
      <FormAtividade textoBotao="Criar atividade" textoEnviando="Salvando..." onEnviar={criar} />
    </main>
  )
}

export default CriarAtividade
