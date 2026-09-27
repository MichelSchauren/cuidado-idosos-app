-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 23/08/2026 às 14:27
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

--
-- Despejando dados para a tabela `paciente`
--

INSERT INTO `paciente` (`id`, `nome`, `cpf`, `data_nascimento`, `sexo`, `telefone`, `endereco`, `status_atencao`, `observacoes`, `foto`) VALUES
(1, 'Paciente_exemplo', '00000000000', '1939-01-01', 'M', '00000000000', 'Feliz-RS, Brasil.', 'Estável', '', NULL);

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

--
-- Despejando dados para a tabela `responsavel`
--

INSERT INTO `responsavel` (`id`, `usuario_id`, `nome`, `cpf`, `telefone`, `data_nascimento`, `sexo`) VALUES
(1, 1, 'admin', NULL, NULL, NULL, NULL);

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

--
-- Despejando dados para a tabela `responsavel_paciente`
--

INSERT INTO `responsavel_paciente` (`id`, `responsavel_id`, `paciente_id`, `grau_parentesco`, `pode_editar_paciente`, `pode_convidar_cuidador`) VALUES
(1, 1, 1, NULL, 1, 1);

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuario`
--

CREATE TABLE `usuario` (
  `id` bigint(20) NOT NULL,
  `login` varchar(50) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `senha` varchar(255) NOT NULL,
  `tipo_usuario` enum('cuidador','responsavel') NOT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `foto_perfil` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `usuario`
--

INSERT INTO `usuario` (`id`, `login`, `senha`, `tipo_usuario`, `ativo`, `criado_em`, `foto_perfil`) VALUES
(1, 'admin', '$2b$10$CJm4Ui9jhhdnAEBWlEFLiexb/OXwemiDqltOw8afnhhFJkPnbOwZ.', 'responsavel', 1, '2026-07-26 23:51:26', NULL);

--
-- Índices para tabelas despejadas
--

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
  ADD UNIQUE KEY `login` (`login`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `cuidador`
--
ALTER TABLE `cuidador`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `cuidador_paciente`
--
ALTER TABLE `cuidador_paciente`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `paciente`
--
ALTER TABLE `paciente`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `responsavel`
--
ALTER TABLE `responsavel`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `responsavel_paciente`
--
ALTER TABLE `responsavel_paciente`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Restrições para tabelas despejadas
--

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
