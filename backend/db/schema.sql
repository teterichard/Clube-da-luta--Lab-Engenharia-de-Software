-- Topa-aí — schema inicial para o UC 5.2 (Criar Atividade)
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
  CONSTRAINT fk_atividade_organizador FOREIGN KEY (organizador_id) REFERENCES usuario(id),
  CONSTRAINT ck_atividade_integrantes CHECK (numero_integrantes >= 2),
  INDEX idx_atividade_data (data_hora),
  INDEX idx_atividade_filtros (tipo, nivel, publico_alvo)
);
