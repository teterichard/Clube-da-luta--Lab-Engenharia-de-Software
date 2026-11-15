import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import './style.css'

import Card from '../../components/Card'
import Aviso from '../../components/Aviso'
import { listarAtividades } from '../../services/api'
import { TIPOS, NIVEIS, PUBLICOS, imagemDoTipo, formatarData } from '../../utils/atividade'

// Tela 3 (wireframe 4.3) — UC "Inscrever-se em atividade", passos 2 a 4: lista + filtros
function Busca() {
  const navigate = useNavigate()
  // o "local" fica na URL (?local=...) para a barra de busca do topo funcionar
  const [params, setParams] = useSearchParams()
  const local = params.get('local') || ''

  const [filtros, setFiltros] = useState({
    tipo: '',
    nivel: '',
    publicoAlvo: '',
    data: '',
    comVaga: true,
  })
  const [atividades, setAtividades] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  // busca de novo sempre que um filtro muda
  useEffect(() => {
    listarAtividades({ ...filtros, local })
      .then((lista) => { setAtividades(lista); setErro('') })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false))
  }, [filtros, local])

  function alterar(campo, valor) {
    setCarregando(true)
    if (campo === 'local') setParams(valor ? { local: valor } : {})
    else setFiltros({ ...filtros, [campo]: valor })
  }

  function limpar() {
    setCarregando(true)
    setParams({})
    setFiltros({ tipo: '', nivel: '', publicoAlvo: '', data: '', comVaga: false })
  }

  return (
    <main className="pagina">
      <h2 className="pagina-titulo">Buscar atividades</h2>
      <p className="pagina-subtitulo">Filtre por modalidade, nível, público e data.</p>

      <div className="painel filtros">
        <select value={filtros.tipo} onChange={(e) => alterar('tipo', e.target.value)}>
          <option value="">Todas as modalidades</option>
          {TIPOS.map((t) => <option key={t.valor} value={t.valor}>{t.texto}</option>)}
        </select>

        <select value={filtros.nivel} onChange={(e) => alterar('nivel', e.target.value)}>
          <option value="">Qualquer nível</option>
          {NIVEIS.map((n) => <option key={n.valor} value={n.valor}>{n.texto}</option>)}
        </select>

        <select value={filtros.publicoAlvo} onChange={(e) => alterar('publicoAlvo', e.target.value)}>
          <option value="">Qualquer público</option>
          {PUBLICOS.map((p) => <option key={p.valor} value={p.valor}>{p.texto}</option>)}
        </select>

        <input type="date" value={filtros.data} onChange={(e) => alterar('data', e.target.value)} />

        <input
          className="filtro-local"
          placeholder="Local (ex.: Ibirapuera)"
          value={local}
          onChange={(e) => alterar('local', e.target.value)}
        />

        <label className="filtro-check">
          <input type="checkbox" checked={filtros.comVaga} onChange={(e) => alterar('comVaga', e.target.checked)} />
          Só com vagas
        </label>

        <button className="btn btn_pequeno btn_cinza" onClick={limpar}>Limpar filtros</button>
      </div>

      <Aviso tipo="erro">{erro}</Aviso>

      {carregando && <p className="vazio">Carregando...</p>}

      {!carregando && !erro && (
        <>
          <p className="resultado-qtd">{atividades.length} atividade(s) encontrada(s)</p>
          {atividades.length === 0 && (
            <p className="vazio">Nada por aqui com esses filtros 😕 Tente mudar alguma opção.</p>
          )}
          <div className="grade">
            {atividades.map((a) => (
              <Card
                key={a.id}
                titulo={a.titulo}
                asset={imagemDoTipo(a.tipo)}
                desc={a.descricao || a.local}
                info={`${formatarData(a.dataHora)} · ${a.vagas} vagas`}
                btn_txt="Ver Detalhes"
                btn_type="focused"
                onClick={() => navigate(`/atividades/${a.id}`)}
              />
            ))}
          </div>
        </>
      )}
    </main>
  )
}

export default Busca
