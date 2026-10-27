const StatusAtividade = Object.freeze({
  AGENDADA: 'AGENDADA',
  ATIVA: 'ATIVA',
  CANCELADA: 'CANCELADA',
  CONCLUIDA: 'CONCLUIDA',
});

const Visibilidade = Object.freeze({
  PUBLICA: 'PUBLICA',
  PRIVADA: 'PRIVADA',
});

const Nivel = Object.freeze({
  INICIANTE: 'iniciante',
  INTERMEDIARIO: 'intermediario',
  AVANCADO: 'avancado',
});

/** Diagrama de classes (5.4) — StatusParticipacaoEnum. */
const StatusParticipacao = Object.freeze({
  PENDENTE: 'PENDENTE',
  ACEITO: 'ACEITO',
  REJEITADO: 'REJEITADO',
});

module.exports = { StatusAtividade, Visibilidade, Nivel, StatusParticipacao };
