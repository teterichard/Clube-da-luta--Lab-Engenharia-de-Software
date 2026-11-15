import { Routes, Route } from 'react-router-dom'

import './App.css'
import './pages/pages.css'

// Componentes
import Header from './components/Header'

// Páginas
import Home from './pages/Home'
import Busca from './pages/Busca'
import CriarAtividade from './pages/CriarAtividade'
import DetalhesAtividade from './pages/DetalhesAtividade'
import Perfil from './pages/Perfil'
import EmBreve from './pages/EmBreve'

function App() {
  return (
    <>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/busca" element={<Busca />} />
        <Route path="/atividades/nova" element={<CriarAtividade />} />
        <Route path="/atividades/:id" element={<DetalhesAtividade />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/comunidades" element={<EmBreve titulo="Comunidades" />} />
        <Route path="/contato" element={<EmBreve titulo="Contato" />} />
        <Route path="*" element={<EmBreve titulo="Página não encontrada" />} />
      </Routes>

      <footer></footer>
    </>
  )
}

export default App
