-- Topa-aí — schema do banco MySQL.
-- Mudou o schema? Recrie o banco local: docker compose down && docker compose up -d
CREATE TABLE IF NOT EXISTS usuario (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nome          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  senha_hash    VARCHAR(255) NOT NULL,
  localizacao   VARCHAR(150),
  idade         INT,
  proficiencia  VARCHAR(30),
  criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS atividade (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  titulo              VARCHAR(100) NOT NULL,
  descricao           VARCHAR(500),
  tipo                VARCHAR(50)  NOT NULL,
  nivel               ENUM('iniciante','intermediario','avancado') NOT NULL,
  publico_alvo        VARCHAR(50)  NOT NULL,
  data_hora           DATETIME     NOT NULL,
  local               VARCHAR(200) NOT NULL,
  numero_integrantes  INT          NOT NULL,
  visibilidade        ENUM('PUBLICA','PRIVADA') NOT NULL DEFAULT 'PUBLICA',
  status              ENUM('AGENDADA','ATIVA','CANCELADA','CONCLUIDA') NOT NULL DEFAULT 'AGENDADA',
  organizador_id      INT          NOT NULL,
  criada_em           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizada_em       DATETIME     NULL,
  CONSTRAINT fk_atividade_organizador FOREIGN KEY (organizador_id) REFERENCES usuario(id),
  CONSTRAINT ck_atividade_integrantes CHECK (numero_integrantes >= 2),
  INDEX idx_atividade_data (data_hora),
  INDEX idx_atividade_filtros (tipo, nivel, publico_alvo)
);

-- UC "Inscrever-se em atividade" — solicitações de participação (StatusParticipacaoEnum)
CREATE TABLE IF NOT EXISTS participacao (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  atividade_id   INT NOT NULL,
  usuario_id     INT NOT NULL,
  status         ENUM('PENDENTE','ACEITO','REJEITADO','CANCELADO') NOT NULL DEFAULT 'PENDENTE',
  solicitada_em  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  respondida_em  DATETIME NULL,
  cancelada_em   DATETIME NULL,
  CONSTRAINT fk_participacao_atividade FOREIGN KEY (atividade_id) REFERENCES atividade(id) ON DELETE CASCADE,
  CONSTRAINT fk_participacao_usuario   FOREIGN KEY (usuario_id)   REFERENCES usuario(id),
  INDEX idx_participacao_atividade (atividade_id, status),
  INDEX idx_participacao_usuario (usuario_id, atividade_id)
);

-- RF07 — convites do organizador para pessoas específicas (entidade Convite do diagrama)
CREATE TABLE IF NOT EXISTS convite (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  atividade_id   INT NOT NULL,
  convidado_id   INT NOT NULL,
  status         ENUM('PENDENTE','ACEITO','RECUSADO') NOT NULL DEFAULT 'PENDENTE',
  criado_em      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  respondido_em  DATETIME NULL,
  CONSTRAINT fk_convite_atividade FOREIGN KEY (atividade_id) REFERENCES atividade(id) ON DELETE CASCADE,
  CONSTRAINT fk_convite_convidado FOREIGN KEY (convidado_id) REFERENCES usuario(id),
  INDEX idx_convite_atividade (atividade_id),
  INDEX idx_convite_convidado (convidado_id, status)
);

-- Notificações dentro da plataforma (geradas pelos eventos de domínio — padrão Observer)
CREATE TABLE IF NOT EXISTS notificacao (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id    INT NOT NULL,
  tipo          VARCHAR(40)  NOT NULL,
  mensagem      VARCHAR(255) NOT NULL,
  atividade_id  INT NULL,
  lida          TINYINT(1)   NOT NULL DEFAULT 0,
  criada_em     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notificacao_usuario   FOREIGN KEY (usuario_id)   REFERENCES usuario(id),
  CONSTRAINT fk_notificacao_atividade FOREIGN KEY (atividade_id) REFERENCES atividade(id) ON DELETE SET NULL,
  INDEX idx_notificacao_usuario (usuario_id, lida, criada_em)
);

-- Comunidades de interesse (classe Comunidade) e seus membros
CREATE TABLE IF NOT EXISTS comunidade (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nome          VARCHAR(80)  NOT NULL,
  descricao     VARCHAR(500) NOT NULL,
  visibilidade  ENUM('PUBLICA','PRIVADA') NOT NULL DEFAULT 'PUBLICA',
  criador_id    INT NOT NULL,
  criada_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comunidade_criador FOREIGN KEY (criador_id) REFERENCES usuario(id),
  INDEX idx_comunidade_nome (nome)
);

CREATE TABLE IF NOT EXISTS comunidade_membro (
  comunidade_id  INT NOT NULL,
  usuario_id     INT NOT NULL,
  papel          ENUM('ADMIN','MEMBRO') NOT NULL DEFAULT 'MEMBRO',
  status         ENUM('ATIVO','PENDENTE') NOT NULL DEFAULT 'ATIVO',
  entrou_em      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (comunidade_id, usuario_id),
  CONSTRAINT fk_membro_comunidade FOREIGN KEY (comunidade_id) REFERENCES comunidade(id) ON DELETE CASCADE,
  CONSTRAINT fk_membro_usuario    FOREIGN KEY (usuario_id)    REFERENCES usuario(id),
  INDEX idx_membro_usuario (usuario_id)
);
