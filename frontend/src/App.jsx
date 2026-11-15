import { Routes, Route } from 'react-router-dom'

import './App.css'
import './pages/pages.css'

// Componentes
import Header from './components/Header'
import RotaProtegida from './components/RotaProtegida'

// Páginas
import Home from './pages/Home'
import Busca from './pages/Busca'
import CriarAtividade from './pages/CriarAtividade'
import DetalhesAtividade from './pages/DetalhesAtividade'
import Perfil from './pages/Perfil'
import Entrar from './pages/Entrar'
import Cadastro from './pages/Cadastro'
import EmBreve from './pages/EmBreve'

function App() {
  return (
    <>
      <Header />

      <Routes>
        {/* públicas */}
        <Route path="/entrar" element={<Entrar />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/contato" element={<EmBreve titulo="Contato" />} />

        {/* exigem login (todas as rotas da API são autenticadas) */}
        <Route element={<RotaProtegida />}>
          <Route path="/" element={<Home />} />
          <Route path="/busca" element={<Busca />} />
          <Route path="/atividades/nova" element={<CriarAtividade />} />
          <Route path="/atividades/:id" element={<DetalhesAtividade />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/comunidades" element={<EmBreve titulo="Comunidades" />} />
        </Route>

        <Route path="*" element={<EmBreve titulo="Página não encontrada" />} />
      </Routes>

      <footer></footer>
    </>
  )
}

export default App
