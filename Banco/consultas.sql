CREATE TABLE `consulta` (
  `id` bigint(20) NOT NULL,
  `paciente_id` bigint(20) NOT NULL,
  `especialidade` varchar(100) DEFAULT NULL,
  `medico` varchar(150) DEFAULT NULL,
  `local` varchar(255) DEFAULT NULL,
  `data_hora` datetime NOT NULL,
  `observacoes` text DEFAULT NULL,
  `criado_por` bigint(20) NOT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices
--
ALTER TABLE `consulta`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paciente_id` (`paciente_id`),
  ADD KEY `criado_por` (`criado_por`);

--
-- AUTO_INCREMENT
--
ALTER TABLE `consulta`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- Chaves estrangeiras
--
ALTER TABLE `consulta`
  ADD CONSTRAINT `consulta_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `paciente` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `consulta_ibfk_2` FOREIGN KEY (`criado_por`) REFERENCES `usuario` (`id`);

--
-- Vincula consultas às tarefas únicas geradas automaticamente.
--
ALTER TABLE `tarefa`
  MODIFY `origem` enum('manual','medicamento','consulta') NOT NULL DEFAULT 'manual',
  ADD `consulta_id` bigint(20) DEFAULT NULL,
  ADD KEY `consulta_id` (`consulta_id`),
  ADD CONSTRAINT `tarefa_ibfk_4` FOREIGN KEY (`consulta_id`) REFERENCES `consulta` (`id`) ON DELETE CASCADE;