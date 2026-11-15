const doisDigitos = (n) => String(n).padStart(2, '0')

/** Converte uma atividade da API para os campos do formulário (data e hora locais separadas). */
export function paraFormulario(atividade) {
  const d = new Date(atividade.dataHora)
  return {
    titulo: atividade.titulo,
    descricao: atividade.descricao || '',
    tipo: atividade.tipo,
    nivel: atividade.nivel,
    publicoAlvo: atividade.publicoAlvo,
    data: `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`,
    hora: `${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`,
    local: atividade.local,
    numeroIntegrantes: atividade.numeroIntegrantes,
    visibilidade: atividade.visibilidade,
  }
}
