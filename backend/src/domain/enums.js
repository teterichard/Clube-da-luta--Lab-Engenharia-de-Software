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

module.exports = { StatusAtividade, Visibilidade, Nivel };
