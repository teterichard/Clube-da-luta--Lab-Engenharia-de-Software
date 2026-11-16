// Etiqueta colorida de status. `mapa` vem de utils/status.js (texto + classe de cor).
function Tag({ mapa, status }) {
  const info = mapa[status] || { texto: status, classe: '' }
  return <span className={`tag ${info.classe}`}>{info.texto}</span>
}

export default Tag
