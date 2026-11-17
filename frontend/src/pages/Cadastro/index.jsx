import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import Aviso from '../../components/Aviso'
import Campo from '../../components/Campo'
import { useAuth } from '../../contexts/AuthContext'
import { NIVEIS } from '../../utils/atividade'

// RF01 — cadastro de usuário. Mesmas regras do back-end (domain/usuario.js) para avisar antes de enviar.
const VAZIO = { nome: '', email: '', senha: '', confirmacao: '', localizacao: '', idade: '', proficiencia: '' }

function validar(form) {
  const erros = {}
  const nome = form.nome.trim()
  if (nome.length < 2 || nome.length > 100) erros.nome = 'Informe seu nome (2 a 100 caracteres)'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) erros.email = 'E-mail inválido'
  if (form.senha.length < 8) erros.senha = 'A senha precisa ter pelo menos 8 caracteres'
  if (form.confirmacao !== form.senha) erros.confirmacao = 'As senhas não conferem'
  if (form.idade !== '') {
    const idade = Number(form.idade)
    if (!Number.isInteger(idade) || idade < 13 || idade > 120) erros.idade = 'Idade entre 13 e 120 anos'
  }
  return erros
}

function Cadastro() {
  const { usuario, cadastrar } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const destino = location.state?.de || '/'

  const [form, setForm] = useState(VAZIO)
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (usuario) return <Navigate to={destino} replace />

  function alterar(campo, valor) {
    setForm({ ...form, [campo]: valor })
    setErros({ ...erros, [campo]: undefined })
  }

  async function enviar(e) {
    e.preventDefault()
    setErroGeral('')
    const encontrados = validar(form)
    setErros(encontrados)
    if (Object.keys(encontrados).length > 0) return

    setEnviando(true)
    try {
      await cadastrar({
        nome: form.nome.trim(),
        email: form.email.trim(),
        senha: form.senha,
        localizacao: form.localizacao.trim() || undefined,
        idade: form.idade === '' ? undefined : Number(form.idade),
        proficiencia: form.proficiencia || undefined,
      })
      navigate(destino, { replace: true })
    } catch (erro) {
      const porCampo = {}
      erro.detalhes.forEach((d) => { porCampo[d.campo] = d.mensagem })
      setErros(porCampo)
      setErroGeral(erro.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main id="conteudo" className="pagina pagina_estreita">
      <h1 className="pagina-titulo">Criar conta</h1>
      <p className="pagina-subtitulo">Em um minuto você já pode participar e organizar atividades.</p>

      <Aviso tipo="erro">{erroGeral}</Aviso>

      <form className="painel form" onSubmit={enviar} noValidate>
        <Campo nome="nome" label="Nome *" erro={erros.nome}>
          <input id="nome" autoComplete="name" value={form.nome} onChange={(e) => alterar('nome', e.target.value)} />
        </Campo>
        <Campo nome="email" label="E-mail *" erro={erros.email}>
          <input id="email" type="email" autoComplete="email" value={form.email}
            onChange={(e) => alterar('email', e.target.value)} />
        </Campo>
        <div className="form-linha">
          <Campo nome="senha" label="Senha *" erro={erros.senha} dica="Mínimo de 8 caracteres">
            <input id="senha" type="password" autoComplete="new-password" value={form.senha}
              onChange={(e) => alterar('senha', e.target.value)} />
          </Campo>
          <Campo nome="confirmacao" label="Confirme a senha *" erro={erros.confirmacao}>
            <input id="confirmacao" type="password" autoComplete="new-password" value={form.confirmacao}
              onChange={(e) => alterar('confirmacao', e.target.value)} />
          </Campo>
        </div>
        <div className="form-linha">
          <Campo nome="localizacao" label="Bairro ou cidade" erro={erros.localizacao}>
            <input id="localizacao" value={form.localizacao} placeholder="Ex.: Pinheiros, São Paulo"
              onChange={(e) => alterar('localizacao', e.target.value)} />
          </Campo>
          <Campo nome="idade" label="Idade" erro={erros.idade}
            dica="Necessária para atividades e comunidades só para adultos ou só para menores">
            <input id="idade" type="number" min="13" max="120" inputMode="numeric" value={form.idade}
              onChange={(e) => alterar('idade', e.target.value)} />
          </Campo>
        </div>
        <div className="form-linha">
          <Campo nome="proficiencia" label="Seu nível em geral" erro={erros.proficiencia}>
            <select id="proficiencia" value={form.proficiencia} onChange={(e) => alterar('proficiencia', e.target.value)}>
              <option value="">Prefiro não dizer</option>
              {NIVEIS.map((n) => <option key={n.valor} value={n.valor}>{n.texto}</option>)}
            </select>
          </Campo>
        </div>

        <button className="btn" type="submit" disabled={enviando}>
          {enviando ? 'Criando conta...' : 'Criar conta'}
        </button>
        <p className="form-rodape">
          Já tem conta? <Link to="/entrar" state={location.state}>Entrar</Link>
        </p>
      </form>
    </main>
  )
}

export default Cadastro
