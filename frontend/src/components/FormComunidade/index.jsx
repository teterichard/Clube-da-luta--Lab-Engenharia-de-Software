import { useState } from 'react'

import Campo from '../Campo'

// Formulário de comunidade (criar e editar). Mesmas regras do back-end (domain/comunidade.js).
const VAZIO = { nome: '', descricao: '', visibilidade: 'PUBLICA' }

function validar(form) {
  const erros = {}
  const nome = form.nome.trim()
  if (nome.length < 3 || nome.length > 80) erros.nome = 'O nome deve ter entre 3 e 80 caracteres'
  if (!form.descricao.trim()) erros.descricao = 'Conte do que se trata a comunidade'
  else if (form.descricao.length > 500) erros.descricao = 'Máximo de 500 caracteres'
  return erros
}

function FormComunidade({ inicial, textoBotao, onEnviar }) {
  const [form, setForm] = useState(inicial || VAZIO)
  const [erros, setErros] = useState({})
  const [enviando, setEnviando] = useState(false)

  function alterar(campo, valor) {
    setForm({ ...form, [campo]: valor })
    setErros({ ...erros, [campo]: undefined })
  }

  async function enviar(e) {
    e.preventDefault()
    const encontrados = validar(form)
    setErros(encontrados)
    if (Object.keys(encontrados).length > 0) {
      document.getElementById(Object.keys(encontrados)[0])?.focus()
      return
    }
    setEnviando(true)
    try {
      await onEnviar({ nome: form.nome.trim(), descricao: form.descricao.trim(), visibilidade: form.visibilidade })
    } catch (erro) {
      const porCampo = {}
      erro.detalhes.forEach((d) => { porCampo[d.campo] = d.mensagem })
      setErros(porCampo)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="painel form" onSubmit={enviar} noValidate>
      <Campo nome="nome" label="Nome *" erro={erros.nome}>
        <input id="nome" value={form.nome} placeholder="Ex.: Crochê na Zona Oeste"
          onChange={(e) => alterar('nome', e.target.value)} />
      </Campo>
      <Campo nome="descricao" label="Descrição *" erro={erros.descricao} dica={`${form.descricao.length}/500`}>
        <textarea id="descricao" value={form.descricao} placeholder="Quem vocês são, o que fazem, com que frequência..."
          onChange={(e) => alterar('descricao', e.target.value)} />
      </Campo>
      <fieldset className="campo campo-grupo">
        <legend>Quem pode entrar</legend>
        <div className="opcoes" role="radiogroup">
          {[['PUBLICA', 'Qualquer pessoa'], ['PRIVADA', 'Com aprovação']].map(([valor, texto]) => (
            <button key={valor} type="button" role="radio" aria-checked={form.visibilidade === valor}
              className={`opcao ${form.visibilidade === valor ? 'opcao_ativa' : ''}`}
              onClick={() => alterar('visibilidade', valor)}>
              {texto}
            </button>
          ))}
        </div>
        <span className="campo-dica">
          {form.visibilidade === 'PUBLICA'
            ? 'Pública: quem quiser entra na hora.'
            : 'Privada: a pessoa pede para entrar e um administrador aprova. Só membros veem quem participa.'}
        </span>
      </fieldset>
      <button type="submit" className="btn" disabled={enviando}>{enviando ? 'Salvando...' : textoBotao}</button>
    </form>
  )
}

export default FormComunidade
