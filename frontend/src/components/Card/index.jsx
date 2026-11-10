import './style.css';

// info: linha pequena opcional (ex.: data e vagas) / onClick: ação do botão
function Card({ titulo, desc, asset, btn_txt, btn_type, info, onClick }) {

  return (
    <div className="card-componente">
      <img className="card-img" src={asset} alt={titulo}></img>
      <h2 className="card-header">{titulo || "Título padrão"}</h2>
      {info && <span className="card-info">{info}</span>}
      <p  className="card-text"> {desc || "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec vitae urna et tortor finibus mollis ut in dui. Sed scelerisque nisi a urna pulvinar ornare."}  </p>
      <div className="div-btn">

    {btn_txt && (
    <button className={`card-btn ${btn_type == "focused" ? `card-btn_focused` : ''}`} onClick={onClick}>
        {btn_txt}
    </button>
    )}
      </div>
    </div>
  );
}

export default Card;
