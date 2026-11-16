import './style.css';

// Lista horizontal rolável. tabIndex deixa rolar pelo teclado (setas) quando há mais cards do que cabem.
function Carousel({ rotulo, children }) {
  return (
    <div className="carousel-section">

      <div className="carousel-container" role="region" aria-label={rotulo} tabIndex={0}>
        <div className="carousel-track">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Carousel;