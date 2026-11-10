// Funções de apoio para exibir uma atividade na tela

import aulaDanca from '../assets/aula_danca.jpeg'
import basquete from '../assets/basquete_quadra.jpg'
import corrida from '../assets/corrida-em-grupo.jpg'
import yoga from '../assets/yoga_parque.jpg'
import futebol from '../assets/futebol_quadra.jpg'

// A API ainda não guarda imagem, então escolhemos uma pelo tipo da atividade
const IMAGENS = {
  basquete,
  futebol,
  yoga,
  corrida,
  danca: aulaDanca,
}

// Opções usadas nos formulários e filtros (pendência P4: confirmar com o grupo)
export const TIPOS = [
  { valor: 'basquete', texto: 'Basquete' },
  { valor: 'futebol', texto: 'Futebol' },
  { valor: 'corrida', texto: 'Corrida' },
  { valor: 'yoga', texto: 'Yoga' },
  { valor: 'danca', texto: 'Dança' },
  { valor: 'outro', texto: 'Outro' },
]

export const NIVEIS = [
  { valor: 'iniciante', texto: 'Iniciante' },
  { valor: 'intermediario', texto: 'Intermediário' },
  { valor: 'avancado', texto: 'Avançado' },
]

export const PUBLICOS = [
  { valor: 'todos', texto: 'Todos' },
  { valor: 'adultos', texto: 'Adultos (18+)' },
  { valor: 'menores', texto: 'Menores de idade' },
]

function semAcento(texto = '') {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export function imagemDoTipo(tipo) {
  return IMAGENS[semAcento(tipo)] || corrida
}

export function textoDaLista(lista, valor) {
  const item = lista.find((i) => i.valor === valor)
  return item ? item.texto : valor
}

export function formatarData(dataHora) {
  return new Date(dataHora).toLocaleString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
