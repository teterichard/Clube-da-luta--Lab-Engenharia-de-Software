import { useState } from 'react'

import Campo from '../Campo'
import { TIPOS, NIVEIS, PUBLICOS } from '../../utils/atividade'

// Formulário de atividade usado para criar (UC 5.2) e editar (RF04).
// Mesmas regras do back-end (RN01 a RN09) para avisar antes de enviar.

const VAZIO = {
  titulo: '',
  descricao: '',
  tipo: '',
  nivel: '',
  publicoAlvo: '',
  data: '',
  hora: '',
  local: '',
  numeroIntegrantes: 10,
  visibilidade: 'PUBLICA',
}

function validar(form, { dataMudou }) {
  const erros = {}
  const titulo = form.titulo.trim()
  if (titulo.length < 3 || titulo.length > 100) erros.titulo = 'O título deve ter entre 3 e 100 caracteres'
  if (form.descricao.length > 500) erros.descricao = 'Máximo de 500 caracteres'
  if (!form.tipo) erros.tipo = 'Escolha o tipo'
  if (!form.nivel) erros.nivel = 'Escolha o nível'
  if (!form.publicoAlvo) erros.publicoAlvo = 'Escolha o público-alvo'
  if (!form.local.trim()) erros.local = 'Informe o local'

  if (!form.data || !form.hora) {
    erros.dataHora = 'Informe a data e o horário'
  } else if (dataMudou && new Date(`${form.data}T${form.hora}`) <= new Date()) {
    erros.dataHora = 'A data precisa ser no futuro'
  }

  const n = Number(form.numeroIntegrantes)
  if (!Number.isInteger(n) || n < 2) erros.numeroIntegrantes = 'Mínimo de 2 integrantes'
  return erros
}

/**
 * onEnviar(dados) recebe o corpo pronto para a API e deve lançar o ErroApi em caso de falha
 * (os detalhes por campo voltam para o formulário).
 */
function FormAtividade({ inicial, textoBotao, textoEnviando, onEnviar }) {
  const [form, setForm] = useState(inicial || VAZIO)
  const [erros, setErros] = useState({})
  const [enviando, setEnviando] = useState(false)

  function alterar(campo, valor) {
    setForm({ ...form, [campo]: valor })
    const chaveErro = campo === 'data' || campo === 'hora' ? 'dataHora' : campo
    setErros({ ...erros, [chaveErro]: undefined })
  }

  async function enviar(e) {
    e.preventDefault()
    const dataMudou = !inicial || form.data !== inicial.data || form.hora !== inicial.hora
    const encontrados = validar(form, { dataMudou })
    setErros(encontrados)
    if (Object.keys(encontrados).length > 0) {
      document.getElementById(Object.keys(encontrados)[0])?.focus()
      return
    }

    const dados = {
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      tipo: form.tipo,
      nivel: form.nivel,
      publicoAlvo: form.publicoAlvo,
      local: form.local.trim(),
      numeroIntegrantes: Number(form.numeroIntegrantes),
      visibilidade: form.visibilidade,
    }
    // na edição, só manda a data se ela mudou (uma data mantida não precisa ser revalidada)
    if (dataMudou) dados.dataHora = new Date(`${form.data}T${form.hora}`).toISOString()

    setEnviando(true)
    try {
      await onEnviar(dados)
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
      <Campo nome="titulo" label="Título *" erro={erros.titulo}>
        <input id="titulo" value={form.titulo} placeholder="Ex.: Basquete no Ibirapuera"
          onChange={(e) => alterar('titulo', e.target.value)} />
      </Campo>

      <Campo nome="descricao" label="Descrição" erro={erros.descricao} dica={`${form.descricao.length}/500`}>
        <textarea id="descricao" value={form.descricao} placeholder="Conte como vai ser, o que levar..."
          onChange={(e) => alterar('descricao', e.target.value)} />
      </Campo>

      <div className="form-linha">
        <Campo nome="tipo" label="Tipo *" erro={erros.tipo}>
          <select id="tipo" value={form.tipo} onChange={(e) => alterar('tipo', e.target.value)}>
            <option value="">Selecione</option>
            {TIPOS.map((t) => <option key={t.valor} value={t.valor}>{t.texto}</option>)}
          </select>
        </Campo>
        <Campo nome="nivel" label="Nível *" erro={erros.nivel}>
          <select id="nivel" value={form.nivel} onChange={(e) => alterar('nivel', e.target.value)}>
            <option value="">Selecione</option>
            {NIVEIS.map((n) => <option key={n.valor} value={n.valor}>{n.texto}</option>)}
          </select>
        </Campo>
      </div>

      <div className="form-linha">
        <Campo nome="dataHora" label="Data *" erro={erros.dataHora}>
          <input id="dataHora" type="date" value={form.data} onChange={(e) => alterar('data', e.target.value)} />
        </Campo>
        <Campo nome="hora" label="Horário *">
          <input id="hora" type="time" value={form.hora} onChange={(e) => alterar('hora', e.target.value)} />
        </Campo>
      </div>

      <Campo nome="local" label="Local *" erro={erros.local}>
        <input id="local" value={form.local} placeholder="Ex.: Parque Ibirapuera - quadra 3"
          onChange={(e) => alterar('local', e.target.value)} />
      </Campo>

      <div className="form-linha">
        <Campo nome="numeroIntegrantes" label="Nº de integrantes *" erro={erros.numeroIntegrantes}>
          <input id="numeroIntegrantes" type="number" min="2" value={form.numeroIntegrantes}
            onChange={(e) => alterar('numeroIntegrantes', e.target.value)} />
        </Campo>
        <Campo nome="publicoAlvo" label="Público-alvo *" erro={erros.publicoAlvo}>
          <select id="publicoAlvo" value={form.publicoAlvo} onChange={(e) => alterar('publicoAlvo', e.target.value)}>
            <option value="">Selecione</option>
            {PUBLICOS.map((p) => <option key={p.valor} value={p.valor}>{p.texto}</option>)}
          </select>
        </Campo>
      </div>

      <fieldset className="campo campo-grupo">
        <legend>Visibilidade</legend>
        <div className="opcoes" role="radiogroup">
          {[['PUBLICA', 'Pública'], ['PRIVADA', 'Privada']].map(([valor, texto]) => (
            <button key={valor} type="button" role="radio" aria-checked={form.visibilidade === valor}
              className={`opcao ${form.visibilidade === valor ? 'opcao_ativa' : ''}`}
              onClick={() => alterar('visibilidade', valor)}>
              {texto}
            </button>
          ))}
        </div>
        <span className="campo-dica">
          {form.visibilidade === 'PUBLICA'
            ? 'Aparece na busca para todo mundo.'
            : 'Não aparece na busca: só entra quem você convidar.'}
        </span>
      </fieldset>

      <button type="submit" className="btn" disabled={enviando}>
        {enviando ? textoEnviando : textoBotao}
      </button>
    </form>
  )
}

export default FormAtividade
