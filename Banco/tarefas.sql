CREATE TABLE `tarefa` (
  `id` bigint(20) NOT NULL,
  `paciente_id` bigint(20) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `descricao` text DEFAULT NULL,
  `tipo` enum('diaria','semanal','unica') NOT NULL,
  `dia_semana` tinyint(1) DEFAULT NULL,
  `data_especifica` date DEFAULT NULL,
  `origem` enum('manual','medicamento') NOT NULL DEFAULT 'manual',
  `medicamento_horario_id` bigint(20) DEFAULT NULL,
  `criado_por` bigint(20) NOT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `tarefa_ocorrencia` (
  `id` bigint(20) NOT NULL,
  `tarefa_id` bigint(20) NOT NULL,
  `data_referencia` date NOT NULL,
  `concluida` tinyint(1) NOT NULL DEFAULT 0,
  `concluida_por` bigint(20) DEFAULT NULL,
  `concluida_em` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices
--
ALTER TABLE `tarefa`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paciente_id` (`paciente_id`),
  ADD KEY `criado_por` (`criado_por`),
  ADD KEY `medicamento_horario_id` (`medicamento_horario_id`);

ALTER TABLE `tarefa_ocorrencia`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `tarefa_data_unica` (`tarefa_id`,`data_referencia`);

--
-- AUTO_INCREMENT
--
ALTER TABLE `tarefa`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

ALTER TABLE `tarefa_ocorrencia`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- Chaves estrangeiras
--
ALTER TABLE `tarefa`
  ADD CONSTRAINT `tarefa_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `paciente` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tarefa_ibfk_2` FOREIGN KEY (`criado_por`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `tarefa_ibfk_3` FOREIGN KEY (`medicamento_horario_id`) REFERENCES `medicamento_horario` (`id`) ON DELETE CASCADE;

ALTER TABLE `tarefa_ocorrencia`
  ADD CONSTRAINT `tarefa_ocorrencia_ibfk_1` FOREIGN KEY (`tarefa_id`) REFERENCES `tarefa` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tarefa_ocorrencia_ibfk_2` FOREIGN KEY (`concluida_por`) REFERENCES `usuario` (`id`);

-- Cria tarefas diárias para medicamentos e horários já cadastrados.
INSERT INTO `tarefa`
  (`paciente_id`, `titulo`, `descricao`, `tipo`, `dia_semana`, `data_especifica`,
   `origem`, `medicamento_horario_id`, `criado_por`, `ativo`)
SELECT m.`paciente_id`,
       LEFT(CONCAT('Administrar ', m.`nome`, ' às ', TIME_FORMAT(h.`horario`, '%H:%i')), 150),
       CONCAT('Dose diária de ', m.`nome`, '.'),
       'diaria', NULL, NULL, 'medicamento', h.`id`, m.`criado_por`, 1
  FROM `medicamento_horario` h
  JOIN `medicamento` m ON m.`id` = h.`medicamento_id`
 WHERE NOT EXISTS (
   SELECT 1
     FROM `tarefa` existente
    WHERE existente.`origem` = 'medicamento'
      AND existente.`medicamento_horario_id` = h.`id`
 );