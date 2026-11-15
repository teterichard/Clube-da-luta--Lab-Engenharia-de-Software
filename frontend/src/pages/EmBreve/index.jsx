import { Link } from 'react-router-dom'

// Página provisória para telas que ainda serão feitas (Comunidades, Contato...)
function EmBreve({ titulo }) {
  return (
    <main className="pagina">
      <div className="painel" style={{ textAlign: 'center', padding: '40px 16px' }}>
        <h2 className="pagina-titulo">{titulo}</h2>
        <p className="pagina-subtitulo">Essa tela ainda vamos desenvolver </p>
        <Link to="/" className="btn btn_pequeno">Voltar para Eventos</Link>
      </div>
    </main>
  )
}

export default EmBreve
