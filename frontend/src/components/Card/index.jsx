import React, { useState } from 'react';
import './style.css'; 

function Card({ titulo, desc, asset, btn_txt, btn_type }) {

  return (
    <div className="card-componente">
      <img className="card-img" src={asset}></img>
      <h2 className="card-header">{titulo || "Título padrão"}</h2>
      <p  className="card-text"> {desc || "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec vitae urna et tortor finibus mollis ut in dui. Sed scelerisque nisi a urna pulvinar ornare."}  </p>
      <div className="div-btn">
      
    {btn_txt && (
    <button className={`card-btn ${btn_type == "focused" ? `card-btn_focused` : ''}`}>
        {btn_txt}
    </button>
    )}
      </div>
    </div>
  );
}

export default Card;