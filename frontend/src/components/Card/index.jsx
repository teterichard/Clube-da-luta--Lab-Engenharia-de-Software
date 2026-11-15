import './style.css';

// info: linha pequena opcional (ex.: data e vagas) · selo: elemento opcional acima do título (ex.: <Tag />)
// onClick: ação do botão — o aria-label inclui o título para o leitor de tela saber de qual card é o botão
function Card({ titulo, desc, asset, btn_txt, btn_type, info, selo, onClick }) {

  return (
    <article className="card-componente">
      <img className="card-img" src={asset} alt=""></img>
      {selo && <div className="card-selo">{selo}</div>}
      <h3 className="card-header">{titulo}</h3>
      {info && <span className="card-info">{info}</span>}
      {desc && <p className="card-text">{desc}</p>}
      <div className="div-btn">

    {btn_txt && (
    <button type="button" className={`card-btn ${btn_type === "focused" ? `card-btn_focused` : ''}`} onClick={onClick}
      aria-label={`${btn_txt}: ${titulo}`}>
        {btn_txt}
    </button>
    )}
      </div>
    </article>
  );
}

export default Card;
