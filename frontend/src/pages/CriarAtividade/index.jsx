import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import Aviso from '../../components/Aviso'
import { criarAtividade, getToken } from '../../services/api'
import { TIPOS, NIVEIS, PUBLICOS } from '../../utils/atividade'

// UC "Criar atividade" (seção 5.2 do documento / docs/plano-acao-criar-atividade.md)

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

// Mesmas regras do back-end (RN01 a RN09), para avisar o usuário antes de enviar
function validar(form) {
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
  } else if (new Date(`${form.data}T${form.hora}`) <= new Date()) {
    erros.dataHora = 'A data precisa ser no futuro'
  }

  const n = Number(form.numeroIntegrantes)
  if (!Number.isInteger(n) || n < 2) erros.numeroIntegrantes = 'Mínimo de 2 integrantes'
  return erros
}

function CriarAtividade() {
  const navigate = useNavigate()
  const [form, setForm] = useState(VAZIO)
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState('')
  const [enviando, setEnviando] = useState(false)

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
      const atividade = await criarAtividade({
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim(),
        tipo: form.tipo,
        nivel: form.nivel,
        publicoAlvo: form.publicoAlvo,
        dataHora: new Date(`${form.data}T${form.hora}`).toISOString(),
        local: form.local.trim(),
        numeroIntegrantes: Number(form.numeroIntegrantes),
        visibilidade: form.visibilidade,
      })
      navigate(`/atividades/${atividade.id}`, { state: { criada: true } })
    } catch (erro) {
      // 400: a API devolve a lista de campos com problema
      const porCampo = {}
      erro.detalhes.forEach((d) => { porCampo[d.campo] = d.mensagem })
      setErros(porCampo)
      setErroGeral(erro.status === 401 ? 'Você precisa estar logado para criar uma atividade.' : erro.message)
    } finally {
      setEnviando(false)
    }
  }

  // função pequena para não repetir label + erro em todo campo
  const renderCampo = ({ nome, label, children, dica }) => (
    <div className={`campo ${erros[nome] ? 'campo_erro' : ''}`}>
      <label htmlFor={nome}>{label}</label>
      {children}
      {erros[nome] ? <span className="campo-erro">{erros[nome]}</span> : dica && <span className="campo-dica">{dica}</span>}
    </div>
  )

  return (
    <main className="pagina">
      <Link to="/" className="voltar">← Voltar</Link>
      <h2 className="pagina-titulo">Criar atividade</h2>
      <p className="pagina-subtitulo">Preencha os dados e convide a galera para participar.</p>

      {!getToken() && (
        <Aviso tipo="info">
          Você ainda não está logado. <Link to="/perfil">Entre com um token de teste</Link> antes de salvar.
        </Aviso>
      )}
      <Aviso tipo="erro">{erroGeral}</Aviso>

      <form className="painel form" onSubmit={enviar} noValidate>
        {renderCampo({
          nome: 'titulo',
          label: 'Título *',
          children: (
            <input id="titulo" value={form.titulo} placeholder="Ex.: Basquete no Ibirapuera"
              onChange={(e) => alterar('titulo', e.target.value)} />
          ),
        })}

        {renderCampo({
          nome: 'descricao',
          label: 'Descrição',
          dica: `${form.descricao.length}/500`,
          children: (
            <textarea id="descricao" value={form.descricao} placeholder="Conte como vai ser, o que levar..."
              onChange={(e) => alterar('descricao', e.target.value)} />
          ),
        })}

        <div className="form-linha">
          {renderCampo({
            nome: 'tipo',
            label: 'Tipo *',
            children: (
              <select id="tipo" value={form.tipo} onChange={(e) => alterar('tipo', e.target.value)}>
                <option value="">Selecione</option>
                {TIPOS.map((t) => <option key={t.valor} value={t.valor}>{t.texto}</option>)}
              </select>
            ),
          })}
          {renderCampo({
            nome: 'nivel',
            label: 'Nível *',
            children: (
              <select id="nivel" value={form.nivel} onChange={(e) => alterar('nivel', e.target.value)}>
                <option value="">Selecione</option>
                {NIVEIS.map((n) => <option key={n.valor} value={n.valor}>{n.texto}</option>)}
              </select>
            ),
          })}
        </div>

        <div className="form-linha">
          {renderCampo({
            nome: 'dataHora',
            label: 'Data *',
            children: (
              <input id="dataHora" type="date" value={form.data}
                onChange={(e) => { alterar('data', e.target.value); setErros({ ...erros, dataHora: undefined }) }} />
            ),
          })}
          <div className="campo">
            <label htmlFor="hora">Horário *</label>
            <input id="hora" type="time" value={form.hora}
              onChange={(e) => { setForm({ ...form, hora: e.target.value }); setErros({ ...erros, dataHora: undefined }) }} />
          </div>
        </div>

        {renderCampo({
          nome: 'local',
          label: 'Local *',
          children: (
            <input id="local" value={form.local} placeholder="Ex.: Parque Ibirapuera - quadra 3"
              onChange={(e) => alterar('local', e.target.value)} />
          ),
        })}

        <div className="form-linha">
          {renderCampo({
            nome: 'numeroIntegrantes',
            label: 'Nº de integrantes *',
            children: (
              <input id="numeroIntegrantes" type="number" min="2" value={form.numeroIntegrantes}
                onChange={(e) => alterar('numeroIntegrantes', e.target.value)} />
            ),
          })}
          {renderCampo({
            nome: 'publicoAlvo',
            label: 'Público-alvo *',
            children: (
              <select id="publicoAlvo" value={form.publicoAlvo} onChange={(e) => alterar('publicoAlvo', e.target.value)}>
                <option value="">Selecione</option>
                {PUBLICOS.map((p) => <option key={p.valor} value={p.valor}>{p.texto}</option>)}
              </select>
            ),
          })}
        </div>

        <div className="campo">
          <label>Visibilidade</label>
          <div className="opcoes">
            <button type="button" className={`opcao ${form.visibilidade === 'PUBLICA' ? 'opcao_ativa' : ''}`}
              onClick={() => alterar('visibilidade', 'PUBLICA')}>
              Pública
            </button>
            <button type="button" className={`opcao ${form.visibilidade === 'PRIVADA' ? 'opcao_ativa' : ''}`}
              onClick={() => alterar('visibilidade', 'PRIVADA')}>
              Privada
            </button>
          </div>
          <span className="campo-dica">
            {form.visibilidade === 'PUBLICA'
              ? 'Aparece na busca para todo mundo.'
              : 'Só entra quem for convidado (convites ainda em desenvolvimento).'}
          </span>
        </div>

        <button type="submit" className="btn" disabled={enviando}>
          {enviando ? 'Salvando...' : 'Criar atividade'}
        </button>
      </form>
    </main>
  )
}

export default CriarAtividade
