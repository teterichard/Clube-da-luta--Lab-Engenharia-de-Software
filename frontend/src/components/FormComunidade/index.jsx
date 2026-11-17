import { useState } from 'react'

import Campo from '../Campo'
import { TIPOS, PUBLICOS } from '../../utils/atividade'

// Formulário de comunidade (criar e editar). Mesmas regras do back-end (domain/comunidade.js).
// Caso de uso "Criar comunidade" (RF15): modalidade, público-alvo e limite de integrantes são opcionais.
const VAZIO = {
  nome: '', descricao: '', visibilidade: 'PUBLICA', modalidade: '', publicoAlvo: 'todos', vagasMaximas: '',
}

function validar(form) {
  const erros = {}
  const nome = form.nome.trim()
  if (nome.length < 3 || nome.length > 80) erros.nome = 'O nome deve ter entre 3 e 80 caracteres'
  if (!form.descricao.trim()) erros.descricao = 'Conte do que se trata a comunidade'
  else if (form.descricao.length > 500) erros.descricao = 'Máximo de 500 caracteres'
  if (form.vagasMaximas !== '' && form.vagasMaximas != null) {
    const n = Number(form.vagasMaximas)
    if (!Number.isInteger(n) || n < 2) erros.vagasMaximas = 'Mínimo de 2 integrantes (ou deixe em branco para não limitar)'
  }
  return erros
}

function FormComunidade({ inicial, textoBotao, onEnviar }) {
  const [form, setForm] = useState({ ...VAZIO, ...inicial })
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
      await onEnviar({
        nome: form.nome.trim(),
        descricao: form.descricao.trim(),
        visibilidade: form.visibilidade,
        modalidade: form.modalidade || null,
        publicoAlvo: form.publicoAlvo || null,
        vagasMaximas: form.vagasMaximas === '' || form.vagasMaximas == null ? null : Number(form.vagasMaximas),
      })
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
      <div className="form-linha">
        <Campo nome="modalidade" label="Modalidade" erro={erros.modalidade}>
          <select id="modalidade" value={form.modalidade || ''} onChange={(e) => alterar('modalidade', e.target.value)}>
            <option value="">Não se aplica</option>
            {TIPOS.map((t) => <option key={t.valor} value={t.valor}>{t.texto}</option>)}
          </select>
        </Campo>
        <Campo nome="publicoAlvo" label="Público-alvo" erro={erros.publicoAlvo}
          dica={form.publicoAlvo === 'adultos' || form.publicoAlvo === 'menores' ? 'A idade de quem entra é conferida' : undefined}>
          <select id="publicoAlvo" value={form.publicoAlvo || ''} onChange={(e) => alterar('publicoAlvo', e.target.value)}>
            {PUBLICOS.map((p) => <option key={p.valor} value={p.valor}>{p.texto}</option>)}
          </select>
        </Campo>
      </div>
      <Campo nome="vagasMaximas" label="Número máximo de integrantes" erro={erros.vagasMaximas}
        dica="Deixe em branco para não limitar. Você já conta como integrante.">
        <input id="vagasMaximas" type="number" min="2" inputMode="numeric" value={form.vagasMaximas ?? ''}
          onChange={(e) => alterar('vagasMaximas', e.target.value)} />
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
