import { useState } from 'react'

import Aviso from '../../components/Aviso'
import Campo from '../../components/Campo'
import { useAuth } from '../../contexts/AuthContext'
import { atualizarPerfil } from '../../services/api'
import { NIVEIS } from '../../utils/atividade'

// Perfil do usuário logado: dados usados para sugerir atividades do nível certo (persona Francisco)
function Perfil() {
  const { usuario, atualizarUsuario, sair } = useAuth()

  const [form, setForm] = useState({
    nome: usuario.nome || '',
    localizacao: usuario.localizacao || '',
    idade: usuario.idade ?? '',
    proficiencia: usuario.proficiencia || '',
  })
  const [erros, setErros] = useState({})
  const [mensagem, setMensagem] = useState('')
  const [erroGeral, setErroGeral] = useState('')
  const [salvando, setSalvando] = useState(false)

  function alterar(campo, valor) {
    setForm({ ...form, [campo]: valor })
    setErros({ ...erros, [campo]: undefined })
    setMensagem('')
  }

  async function salvar(e) {
    e.preventDefault()
    setErroGeral('')
    setSalvando(true)
    try {
      const atualizado = await atualizarPerfil({
        nome: form.nome.trim(),
        localizacao: form.localizacao.trim(),
        idade: form.idade === '' ? null : Number(form.idade),
        proficiencia: form.proficiencia || null,
      })
      atualizarUsuario(atualizado)
      setMensagem('Perfil atualizado!')
    } catch (erro) {
      const porCampo = {}
      erro.detalhes.forEach((d) => { porCampo[d.campo] = d.mensagem })
      setErros(porCampo)
      setErroGeral(erro.message)
    } finally {
      setSalvando(false)
    }
  }

  function encerrar() {
    // a rota protegida leva para /entrar sozinha
    sair({ voluntario: true })
  }

  return (
    <main id="conteudo" className="pagina pagina_estreita">
      <h1 className="pagina-titulo">Meu perfil</h1>
      <p className="pagina-subtitulo">{usuario.email}</p>

      <Aviso tipo="sucesso">{mensagem}</Aviso>
      <Aviso tipo="erro">{erroGeral}</Aviso>

      <form className="painel form" onSubmit={salvar} noValidate>
        <Campo nome="nome" label="Nome" erro={erros.nome}>
          <input id="nome" value={form.nome} onChange={(e) => alterar('nome', e.target.value)} />
        </Campo>
        <Campo nome="localizacao" label="Bairro ou cidade" erro={erros.localizacao}>
          <input id="localizacao" value={form.localizacao} onChange={(e) => alterar('localizacao', e.target.value)} />
        </Campo>
        <div className="form-linha">
          <Campo nome="idade" label="Idade" erro={erros.idade}>
            <input id="idade" type="number" min="13" max="120" value={form.idade}
              onChange={(e) => alterar('idade', e.target.value)} />
          </Campo>
          <Campo nome="proficiencia" label="Nível em geral" erro={erros.proficiencia}>
            <select id="proficiencia" value={form.proficiencia} onChange={(e) => alterar('proficiencia', e.target.value)}>
              <option value="">Prefiro não dizer</option>
              {NIVEIS.map((n) => <option key={n.valor} value={n.valor}>{n.texto}</option>)}
            </select>
          </Campo>
        </div>
        <button className="btn" type="submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar alterações'}</button>
      </form>

      <button className="btn btn_vermelho btn_pequeno" type="button" onClick={encerrar}>Sair da conta</button>
    </main>
  )
}

export default Perfil
