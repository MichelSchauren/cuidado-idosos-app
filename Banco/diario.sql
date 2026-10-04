CREATE TABLE `diario` (
  `id` bigint(20) NOT NULL,
  `paciente_id` bigint(20) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `descricao` text DEFAULT NULL,
  `registrado_por` bigint(20) NOT NULL,
  `registrado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices
--
ALTER TABLE `diario`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paciente_id` (`paciente_id`),
  ADD KEY `registrado_por` (`registrado_por`);

--
-- AUTO_INCREMENT
--
ALTER TABLE `diario`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- Chaves estrangeiras
--
ALTER TABLE `diario`
  ADD CONSTRAINT `diario_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `paciente` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `diario_ibfk_2` FOREIGN KEY (`registrado_por`) REFERENCES `usuario` (`id`);