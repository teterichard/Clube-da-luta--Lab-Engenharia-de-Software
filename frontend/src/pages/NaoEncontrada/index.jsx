import { Link } from 'react-router-dom'

// Rota inexistente (404 do front)
function NaoEncontrada() {
  return (
    <main id="conteudo" className="pagina">
      <div className="painel" style={{ textAlign: 'center', padding: '40px 16px' }}>
        <h1 className="pagina-titulo">Página não encontrada</h1>
        <p className="pagina-subtitulo">O endereço pode ter mudado ou a página não existe mais.</p>
        <Link to="/" className="btn btn_pequeno">Voltar para o início</Link>
      </div>
    </main>
  )
}

export default NaoEncontrada
