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
  CANCELADO: 'CANCELADO', // o próprio participante desistiu (pendência P6)
});

/** Convite do organizador para uma pessoa específica (RF07 — entidade Convite do diagrama). */
const StatusConvite = Object.freeze({
  PENDENTE: 'PENDENTE',
  ACEITO: 'ACEITO',
  RECUSADO: 'RECUSADO',
});

/** Comunidades (classe Comunidade do protótipo Java): papel e situação de cada membro. */
const PapelMembro = Object.freeze({
  ADMIN: 'ADMIN',
  MEMBRO: 'MEMBRO',
});

const StatusMembro = Object.freeze({
  ATIVO: 'ATIVO',
  PENDENTE: 'PENDENTE', // pediu para entrar numa comunidade privada
});

module.exports = {
  StatusAtividade,
  Visibilidade,
  Nivel,
  StatusParticipacao,
  StatusConvite,
  PapelMembro,
  StatusMembro,
};
