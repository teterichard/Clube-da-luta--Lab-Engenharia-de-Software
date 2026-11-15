import React, { useState } from 'react';
import './style.css';

function SearchBar({ onSearch, placeholder = "Buscar por local (ex.: Ibirapuera)" }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  return (
    <form className="search-bar-container" onSubmit={handleSubmit} role="search">
      <svg
        aria-hidden="true"
        className="search-icon" 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>

      {/* Input sem bordas próprias */}
      <label htmlFor="busca-topo" className="sr-only">Buscar atividades por local</label>
      <input
        id="busca-topo"
        type="search"
        className="search-input"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Botão embutido na extremidade direita */}
      <button type="submit" className="search-btn">
        Buscar
      </button>
    </form>
  );
}

export default SearchBar;