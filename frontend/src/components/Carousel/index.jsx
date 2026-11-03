import React from 'react';
import './style.css';

function Carousel({ title, children }) {
  return (
    <section className="carousel-section">

      <div className="carousel-container">
        <div className="carousel-track">
          {children}
        </div>
      </div>
    </section>
  );
}

export default Carousel;