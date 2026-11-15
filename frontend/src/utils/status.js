// Textos e cores (classes .tag_*) para os status que aparecem nas telas

export const STATUS_ATIVIDADE = {
  AGENDADA: { texto: 'Agendada', classe: '' },
  ATIVA: { texto: 'Acontecendo agora', classe: 'tag_verde' },
  CANCELADA: { texto: 'Cancelada', classe: 'tag_vermelha' },
  CONCLUIDA: { texto: 'Concluída', classe: 'tag_cinza' },
}

export const STATUS_PARTICIPACAO = {
  PENDENTE: { texto: 'Aguardando resposta', classe: 'tag_amarela' },
  ACEITO: { texto: 'Presença confirmada', classe: 'tag_verde' },
  REJEITADO: { texto: 'Não aceito', classe: 'tag_vermelha' },
  CANCELADO: { texto: 'Você cancelou', classe: 'tag_cinza' },
}

export const STATUS_SOLICITACAO = {
  PENDENTE: { texto: 'Pendente', classe: 'tag_amarela' },
  ACEITO: { texto: 'Aceito', classe: 'tag_verde' },
  REJEITADO: { texto: 'Recusado', classe: 'tag_vermelha' },
  CANCELADO: { texto: 'Desistiu', classe: 'tag_cinza' },
}

export const STATUS_CONVITE = {
  PENDENTE: { texto: 'Aguardando resposta', classe: 'tag_amarela' },
  ACEITO: { texto: 'Aceito', classe: 'tag_verde' },
  RECUSADO: { texto: 'Recusado', classe: 'tag_vermelha' },
}
