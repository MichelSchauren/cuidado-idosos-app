-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 01/10/2026 às 03:54
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `bd_cuidado_idosos`
--
CREATE DATABASE IF NOT EXISTS `bd_cuidado_idosos` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `bd_cuidado_idosos`;

-- --------------------------------------------------------

--
-- Estrutura para tabela `administracao_medicamento`
--

CREATE TABLE `administracao_medicamento` (
  `id` bigint(20) NOT NULL,
  `medicamento_horario_id` bigint(20) NOT NULL,
  `data_referencia` date NOT NULL,
  `administrado_por` bigint(20) NOT NULL,
  `administrado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `cuidador`
--

CREATE TABLE `cuidador` (
  `id` bigint(20) NOT NULL,
  `usuario_id` bigint(20) NOT NULL,
  `nome` varchar(150) NOT NULL,
  `cpf` char(11) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `data_nascimento` date DEFAULT NULL,
  `sexo` enum('M','F','Outro') DEFAULT NULL,
  `especializacao` varchar(150) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `cuidador_paciente`
--

CREATE TABLE `cuidador_paciente` (
  `id` bigint(20) NOT NULL,
  `cuidador_id` bigint(20) NOT NULL,
  `paciente_id` bigint(20) NOT NULL,
  `turno` varchar(50) DEFAULT NULL,
  `data_inicio` date DEFAULT NULL,
  `data_fim` date DEFAULT NULL,
  `observacoes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `medicamento`
--

CREATE TABLE `medicamento` (
  `id` bigint(20) NOT NULL,
  `paciente_id` bigint(20) NOT NULL,
  `nome` varchar(150) NOT NULL,
  `quantidade_comprimidos` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `criado_por` bigint(20) NOT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `medicamento_horario`
--

CREATE TABLE `medicamento_horario` (
  `id` bigint(20) NOT NULL,
  `medicamento_id` bigint(20) NOT NULL,
  `horario` time NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `paciente`
--

CREATE TABLE `paciente` (
  `id` bigint(20) NOT NULL,
  `nome` varchar(150) NOT NULL,
  `cpf` char(11) NOT NULL,
  `data_nascimento` date DEFAULT NULL,
  `sexo` enum('M','F','Outro') DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `endereco` text DEFAULT NULL,
  `status_atencao` enum('Estável','Atenção','Crítico') DEFAULT 'Estável',
  `observacoes` text DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `responsavel`
--

CREATE TABLE `responsavel` (
  `id` bigint(20) NOT NULL,
  `usuario_id` bigint(20) NOT NULL,
  `nome` varchar(150) NOT NULL,
  `cpf` char(11) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `data_nascimento` date DEFAULT NULL,
  `sexo` enum('M','F','Outro') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `responsavel_paciente`
--

CREATE TABLE `responsavel_paciente` (
  `id` bigint(20) NOT NULL,
  `responsavel_id` bigint(20) NOT NULL,
  `paciente_id` bigint(20) NOT NULL,
  `grau_parentesco` varchar(50) DEFAULT NULL,
  `pode_editar_paciente` tinyint(1) DEFAULT 1,
  `pode_convidar_cuidador` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuario`
--

CREATE TABLE `usuario` (
  `id` bigint(20) NOT NULL,
  `login` varchar(50) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `email` varchar(50) NOT NULL,
  `tipo_usuario` enum('cuidador','responsavel') NOT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `foto_perfil` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `administracao_medicamento`
--
ALTER TABLE `administracao_medicamento`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `dose_diaria_unica` (`medicamento_horario_id`,`data_referencia`),
  ADD KEY `administrado_por` (`administrado_por`);

--
-- Índices de tabela `cuidador`
--
ALTER TABLE `cuidador`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_id` (`usuario_id`),
  ADD UNIQUE KEY `cpf` (`cpf`);

--
-- Índices de tabela `cuidador_paciente`
--
ALTER TABLE `cuidador_paciente`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cuidador_id` (`cuidador_id`,`paciente_id`),
  ADD KEY `paciente_id` (`paciente_id`);

--
-- Índices de tabela `medicamento`
--
ALTER TABLE `medicamento`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paciente_id` (`paciente_id`),
  ADD KEY `criado_por` (`criado_por`);

--
-- Índices de tabela `medicamento_horario`
--
ALTER TABLE `medicamento_horario`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `medicamento_horario_unico` (`medicamento_id`,`horario`);

--
-- Índices de tabela `paciente`
--
ALTER TABLE `paciente`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cpf` (`cpf`);

--
-- Índices de tabela `responsavel`
--
ALTER TABLE `responsavel`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_id` (`usuario_id`),
  ADD UNIQUE KEY `cpf` (`cpf`);

--
-- Índices de tabela `responsavel_paciente`
--
ALTER TABLE `responsavel_paciente`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `responsavel_id` (`responsavel_id`,`paciente_id`),
  ADD KEY `paciente_id` (`paciente_id`);

--
-- Índices de tabela `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `login` (`login`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `administracao_medicamento`
--
ALTER TABLE `administracao_medicamento`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `cuidador`
--
ALTER TABLE `cuidador`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `cuidador_paciente`
--
ALTER TABLE `cuidador_paciente`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `medicamento`
--
ALTER TABLE `medicamento`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `medicamento_horario`
--
ALTER TABLE `medicamento_horario`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `paciente`
--
ALTER TABLE `paciente`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de tabela `responsavel`
--
ALTER TABLE `responsavel`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `responsavel_paciente`
--
ALTER TABLE `responsavel_paciente`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `administracao_medicamento`
--
ALTER TABLE `administracao_medicamento`
  ADD CONSTRAINT `administracao_medicamento_ibfk_1` FOREIGN KEY (`medicamento_horario_id`) REFERENCES `medicamento_horario` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `administracao_medicamento_ibfk_2` FOREIGN KEY (`administrado_por`) REFERENCES `usuario` (`id`);

--
-- Restrições para tabelas `cuidador`
--
ALTER TABLE `cuidador`
  ADD CONSTRAINT `cuidador_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `cuidador_paciente`
--
ALTER TABLE `cuidador_paciente`
  ADD CONSTRAINT `cuidador_paciente_ibfk_1` FOREIGN KEY (`cuidador_id`) REFERENCES `cuidador` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cuidador_paciente_ibfk_2` FOREIGN KEY (`paciente_id`) REFERENCES `paciente` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `medicamento`
--
ALTER TABLE `medicamento`
  ADD CONSTRAINT `medicamento_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `paciente` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `medicamento_ibfk_2` FOREIGN KEY (`criado_por`) REFERENCES `usuario` (`id`);

--
-- Restrições para tabelas `medicamento_horario`
--
ALTER TABLE `medicamento_horario`
  ADD CONSTRAINT `medicamento_horario_ibfk_1` FOREIGN KEY (`medicamento_id`) REFERENCES `medicamento` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `responsavel`
--
ALTER TABLE `responsavel`
  ADD CONSTRAINT `responsavel_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `responsavel_paciente`
--
ALTER TABLE `responsavel_paciente`
  ADD CONSTRAINT `responsavel_paciente_ibfk_1` FOREIGN KEY (`responsavel_id`) REFERENCES `responsavel` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `responsavel_paciente_ibfk_2` FOREIGN KEY (`paciente_id`) REFERENCES `paciente` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
