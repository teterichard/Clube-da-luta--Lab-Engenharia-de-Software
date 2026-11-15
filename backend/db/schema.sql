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
  status         ENUM('PENDENTE','ACEITO','REJEITADO') NOT NULL DEFAULT 'PENDENTE',
  solicitada_em  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  respondida_em  DATETIME NULL,
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
