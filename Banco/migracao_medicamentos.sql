-- Execute este arquivo apenas em bancos que já foram criados anteriormente.
-- Em instalações novas, basta importar bd_cuidado_idosos.sql.

USE `bd_cuidado_idosos`;

CREATE TABLE IF NOT EXISTS `medicamento` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `paciente_id` bigint(20) NOT NULL,
  `nome` varchar(150) NOT NULL,
  `quantidade_comprimidos` int(10) unsigned NOT NULL DEFAULT 0,
  `criado_por` bigint(20) NOT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `paciente_id` (`paciente_id`),
  KEY `criado_por` (`criado_por`),
  CONSTRAINT `medicamento_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `paciente` (`id`) ON DELETE CASCADE,
  CONSTRAINT `medicamento_ibfk_2` FOREIGN KEY (`criado_por`) REFERENCES `usuario` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `medicamento_horario` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `medicamento_id` bigint(20) NOT NULL,
  `horario` time NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `medicamento_horario_unico` (`medicamento_id`,`horario`),
  CONSTRAINT `medicamento_horario_ibfk_1` FOREIGN KEY (`medicamento_id`) REFERENCES `medicamento` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `administracao_medicamento` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `medicamento_horario_id` bigint(20) NOT NULL,
  `data_referencia` date NOT NULL,
  `administrado_por` bigint(20) NOT NULL,
  `administrado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `dose_diaria_unica` (`medicamento_horario_id`,`data_referencia`),
  KEY `administrado_por` (`administrado_por`),
  CONSTRAINT `administracao_medicamento_ibfk_1` FOREIGN KEY (`medicamento_horario_id`) REFERENCES `medicamento_horario` (`id`) ON DELETE CASCADE,
  CONSTRAINT `administracao_medicamento_ibfk_2` FOREIGN KEY (`administrado_por`) REFERENCES `usuario` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
