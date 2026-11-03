import { useState } from 'react'

import aulaDanca from './assets/aula_danca.jpeg'
import partidaBasquete from './assets/basquete_quadra.jpg'
import corridaGrupo from './assets/corrida-em-grupo.jpg'
import yogaParque from './assets/yoga_parque.jpg'
import futebolQuadra from './assets/futebol_quadra.jpg'


import './App.css'

// Componentes
import Card from './components/Card'
import SearchBar from './components/SearchBar'
import Carousel from './components/Carousel'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <header>
        <div className='firstBox'> 
        <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2" 
        stroke-linecap="round" 
        stroke-linejoin="round"
      >
        <line x1="4" y1="6" x2="20" y2="6"></line>
        <line x1="4" y1="12" x2="20" y2="12"></line>
        <line x1="4" y1="18" x2="20" y2="18"></line>
      </svg>
        <h3 className='firstName'>Topa-aí</h3>

        <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2" 
        stroke-linecap="round" 
        stroke-linejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
      </div>
              
        <div  className='searchBox'>
          <SearchBar />     
        </div>
      </header>
      <main className='contentBox'>
        <section className='subcontentBox'>
          <h3 className='contentTitle'>Suas inscrições </h3>
          <Carousel>
            <Card titulo="Aula de Dança" asset={aulaDanca}  desc = "Vem gastar energia e aprender novas coreografias de ritmos variados. Uma aula aberta e descontraída para todos os níveis." btn_txt="Ver Detalhes"/>
            <Card titulo="Basquete" asset={partidaBasquete} desc = "Partida amadora de 3x3 no parque. Basta trazer a tua boa disposição e vontade de jogar. O grupo é super acolhedor!" btn_txt="Ver Detalhes"/>
            <Card titulo="Corrida em Grupo"  asset={corridaGrupo} desc = "Treino leve de 5 km ao ar livre. Ideal para quem quer manter o ritmo, fazer novas amizades e começar o dia com energia." btn_txt="Ver Detalhes"/>
          </Carousel>
        </section>

        <section className='subcontentBox'>
          <h3 className='contentTitle'>Sugestão de novos eventos </h3>
          <Carousel>
            <Card titulo="Yoga no parque" asset={yogaParque}  desc = "Sessão de relaxamento e alongamento na relva ao fim da tarde. Traz o teu tapete e vem desacelerar do stresse da semana." btn_txt="Inscreva-se" btn_type ="focused"/>
            <Card titulo="Futebol Quadra" asset={futebolQuadra} desc = "Pelada amadora de fim de semana entre amigos da comunidade. Garante a tua vaga e vem para o campo dar uns pontapés na bola!" btn_txt="Inscreva-se" btn_type ="focused"/>
          </Carousel>
        </section>


       </main>
      <footer>
       
      </footer>


    </>
  )
}

export default App


//      titulo, desc, asset, btn_txt
