<p align="center">
  <img src="/Frontend/src/assets/logo.png" width="250px;" alt="Cuidaê Logo"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-em_validação-orange" alt="Status do Projeto">
  <img src="https://img.shields.io/badge/license-AGPL--3.0-blue" alt="Licença">
  <img src="https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white" alt="Node.js">
</p>

Sistema web para auxiliar no cuidado e monitoramento de idosos e pessoas com necessidades específicas, facilitando a comunicação entre cuidadores, responsáveis e profissionais de saúde.

Projeto desenvolvido no âmbito do **Laboratório de Ideias**, bolsa de extensão/pesquisa do **Instituto Federal de Educação, Ciência e Tecnologia do Rio Grande do Sul (IFRS) — Campus Feliz**.

---

## 📋 Sobre o projeto

O cuidado de idosos e pessoas com necessidades especiais é um desafio crescente, agravado pelo envelhecimento populacional, pelo aumento de doenças crônicas e pela dificuldade das famílias em oferecer acompanhamento contínuo. Entre os principais problemas enfrentados por cuidadores e responsáveis estão:

- Falta de profissionais qualificados;
- Alto custo dos cuidados;
- Dificuldade no acompanhamento de medicamentos e tratamentos;
- Riscos relacionados a quedas, emergências médicas e doenças neurodegenerativas (como o Alzheimer);
- Comunicação desorganizada entre múltiplos cuidadores e responsáveis.

O projeto propõe uma solução tecnológica para tornar o cuidado mais seguro, humanizado e eficiente.

## 🎯 Objetivo

Criar um sistema para auxiliar no cuidado e monitoramento de idosos e pessoas com alguma necessidade específica, centralizando informações sobre medicação, rotina, saúde e comunicação entre os envolvidos.

## 👥 Stakeholders

- **Cuidadores**
- **Paciente**
- **Responsáveis**

## ✅ Requisitos

### Requisitos funcionais

- Cadastro de stakeholders (paciente, cuidador, responsável);
- Perfil do paciente (dados de doenças, preferências, hábitos etc.);
- Adição de figuras, voz e texto;
- Exclusão de categorias, figuras, voz e texto;
- Checklist de tarefas diárias;
- Diário com avisos importantes;
- Controle de medicamentos em estoque;
- Criação de categorias personalizadas (lugares, ações, cumprimentos etc.);
- Relatórios de rotina e saúde;
- Sistema de alertas por status (Verde/Amarelo/Vermelho).

### Requisitos não funcionais

- Sistema deve funcionar **online**;
- Sistema deve ser **web**;
- Interface simples e intuitiva;
- Design com cores leves, não muito chamativas.

## 🗂️ Modelagem de dados (visão geral)

- **Responsável**: dados pessoais, permissão para editar paciente e convidar cuidadores;
- **Paciente**: dados pessoais, status de atenção (Verde/Amarelo/Vermelho), preferências (alimentação, estilo de vida, comunicação);
- **Cuidador**: dados pessoais, perfil (familiar, enfermeiro etc.), turno;
- **Medicamentos**: medicamento prescrito, dosagem, via de administração, horários, controle de estoque.

## 🚀 Como executar o projeto (para devs)

O projeto é dividido em dois diretórios: **Backend** e **Frontend**. É necessário instalar as dependências e configurar o arquivo `.env` em **ambos**.

### Pré-requisitos

- [Node.js](https://nodejs.org/) e npm instalados;
- MySQL (ou compatível) rodando localmente;
- phpMyAdmin (ou outro cliente de sua preferência, como MySQL Workbench/DBeaver) para importar o banco de dados.

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/cuidae.git
cd cuidae
```

### 2. Instalar dependências

**Backend:**

```bash
cd Backend
npm install
```

**Frontend:**

```bash
cd ../Frontend
npm install
```

### 3. Configurar as variáveis de ambiente

Crie um arquivo `.env` em **cada** diretório (`Backend` e `Frontend`), com o seguinte conteúdo:

**`Backend/.env`**

```env
HOST="localhost"
USER="root"
PASSWORD=""
DATABASE="bd_cuidado_idosos"
PORT=8081
JWT_SECRET=(chave aleatória)
```

> ⚠️ Substitua `USER`, `PASSWORD` e `HOST` conforme a configuração do seu MySQL local. Gere uma `JWT_SECRET` aleatória e segura (ex.: `openssl rand -base64 32`).

**`Frontend/.env`**

```env
VITE_SERVER="http://localhost:8081/api/"
```

### 4. Importar o banco de dados

Os arquivos SQL ficam no diretório `Banco/`.

Usando o **phpMyAdmin**:

1. Acesse o phpMyAdmin (geralmente em `http://localhost/phpmyadmin`);
2. Crie um novo banco de dados chamado `bd_cuidado_idosos`;
3. Selecione o banco criado e clique em **Importar**;
4. Importe `Banco/bd_cuidado_idosos.sql` e confirme.
5. Importe `Banco/tarefas.sql` para criar as tabelas de tarefas e gerar tarefas para medicamentos já cadastrados.
6. Importe `Banco/diario.sql` para criar a tabela de registros do diário.

Alternativamente, via linha de comando:

```bash
mysql -u root -p bd_cuidado_idosos < Banco/bd_cuidado_idosos.sql
mysql -u root -p bd_cuidado_idosos < Banco/tarefas.sql
mysql -u root -p bd_cuidado_idosos < Banco/diario.sql
```

_(crie o banco antes com `CREATE DATABASE bd_cuidado_idosos;`, caso ainda não exista)_

#### Banco já existente

Para habilitar o login por e-mail em uma instalação já configurada, execute uma vez:

```sql
ALTER TABLE usuario
  ADD COLUMN email varchar(255) DEFAULT NULL,
  ADD UNIQUE KEY email (email);
```

Para habilitar a área de medicamentos em um banco existente que ainda não tenha
essas tabelas, importe primeiro `Banco/migracao_medicamentos.sql` e depois
`Banco/tarefas.sql`. A migração de tarefas gera uma tarefa diária para cada
horário de medicamento existente e é executada uma vez por banco. Pelo terminal:

```bash
mysql -u root -p bd_cuidado_idosos < Banco/migracao_medicamentos.sql
mysql -u root -p bd_cuidado_idosos < Banco/tarefas.sql
```

O arquivo principal contém as tabelas de medicamentos; `Banco/tarefas.sql` é
necessário tanto em instalações novas quanto em bancos já existentes.
Execute `Banco/diario.sql` uma vez para ativar o diário em qualquer instalação.

### 5. Rodar o projeto

**Backend:**

```bash
cd Backend
npm start
```

**Frontend:**

```bash
cd Frontend
npm run dev
```

O frontend estará disponível normalmente em `http://localhost:5173` (padrão do Vite), consumindo a API em `http://localhost:8081/api/`.

## 🛠️ Status do projeto

🚧 Em desenvolvimento — fase de levantamento de requisitos, pesquisa exploratória e prototipação.

## 👨‍💻 Colaboradores

| Integrante               | Papel       |
| ------------------------ | ----------- |
| Michel Nathan Schauren   | Bolsista    |
| Alan Eduardo Federhen    | Voluntário  |
| Sandro Oliveira Dorneles | Coordenador |

##

<p align="center">Desenvolvido com 💙 pelo Laboratório de Ideias — IFRS Campus Feliz</p>
