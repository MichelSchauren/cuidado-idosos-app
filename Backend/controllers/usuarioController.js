const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const db = require("../config/db");

function removerFoto(file) {
  if (file) {
    fs.unlink(file.path, () => {});
  }
}

function removerFotoPerfilAnterior(caminhoFoto) {
  const prefixo = "/imagens/foto_usuarios/";
  if (typeof caminhoFoto !== "string" || !caminhoFoto.startsWith(prefixo)) {
    return;
  }

  const arquivo = path.basename(caminhoFoto);
  if (arquivo) {
    fs.unlink(
      path.join(__dirname, "..", "imagens", "foto_usuarios", arquivo),
      () => {},
    );
  }
}

function removerFotoPacienteAnterior(caminhoFoto) {
  const prefixo = "/imagens/foto_pacientes/";
  if (typeof caminhoFoto !== "string" || !caminhoFoto.startsWith(prefixo)) {
    return;
  }

  const arquivo = path.basename(caminhoFoto);
  if (arquivo) {
    fs.unlink(
      path.join(__dirname, "..", "imagens", "foto_pacientes", arquivo),
      () => {},
    );
  }
}

function executarConsulta(sql, parametros) {
  return new Promise((resolve, reject) => {
    db.query(sql, parametros, (err, data) => {
      if (err) return reject(err);
      return resolve(data);
    });
  });
}

function nomeCompletoValido(nome) {
  const nomeNormalizado =
    typeof nome === "string" ? nome.trim().replace(/\s+/g, " ") : "";
  return /^[\p{L}]+(?:[ '-][\p{L}]+)*(?:\s+[\p{L}]+(?:[ '-][\p{L}]+)*)+$/u.test(
    nomeNormalizado,
  );
}

function maiorDeIdade(dataNascimento) {
  if (typeof dataNascimento !== "string") return false;

  const partesData = dataNascimento.split("-").map(Number);
  if (partesData.length !== 3 || partesData.some(Number.isNaN)) return false;

  const [ano, mes, dia] = partesData;
  const nascimento = new Date(ano, mes - 1, dia);
  const dataExiste =
    nascimento.getFullYear() === ano &&
    nascimento.getMonth() === mes - 1 &&
    nascimento.getDate() === dia;
  if (!dataExiste) return false;

  const limite = new Date();
  limite.setHours(0, 0, 0, 0);
  limite.setFullYear(limite.getFullYear() - 18);
  return nascimento <= limite;
}

function executarConsultaNaConexao(conexao, sql, parametros) {
  return new Promise((resolve, reject) => {
    conexao.query(sql, parametros, (err, data) => {
      if (err) return reject(err);
      return resolve(data);
    });
  });
}

function abrirTransacaoExclusiva() {
  const conexao = db.criarConexaoTransacional();
  return new Promise((resolve, reject) => {
    conexao.beginTransaction((err) => {
      if (err) {
        conexao.end();
        return reject(err);
      }
      return resolve(conexao);
    });
  });
}

const relacoesPaciente = {
  responsavel: {
    tabelaPerfil: "responsavel",
    tabelaRelacao: "responsavel_paciente",
    colunaPerfil: "responsavel_id",
  },
  cuidador: {
    tabelaPerfil: "cuidador",
    tabelaRelacao: "cuidador_paciente",
    colunaPerfil: "cuidador_id",
  },
};

function tipoUsuario(req) {
  return req.user?.tipo_usuario || req.user?.tipo;
}

async function usuarioTemAcessoAoPaciente(usuarioId, tipo, pacienteId) {
  const relacao = relacoesPaciente[tipo];
  if (!usuarioId || !relacao || !/^\d+$/.test(String(pacienteId))) return false;

  const registros = await executarConsulta(
    `SELECT 1
       FROM ${relacao.tabelaRelacao} x
       JOIN ${relacao.tabelaPerfil} perfil
         ON perfil.id = x.${relacao.colunaPerfil}
      WHERE perfil.usuario_id = ? AND x.paciente_id = ?
      LIMIT 1`,
    [usuarioId, pacienteId],
  );
  return registros.length > 0;
}

function dataValida(data) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data || "")) return false;
  const [ano, mes, dia] = data.split("-").map(Number);
  const valor = new Date(ano, mes - 1, dia);
  return (
    valor.getFullYear() === ano &&
    valor.getMonth() === mes - 1 &&
    valor.getDate() === dia
  );
}

function dataAtualLocal() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

// Login
function login(req, res) {
  const identificador = req.body.login || req.body.email;
  const { senha } = req.body;

  if (!identificador || !senha) {
    return res.status(400).json({ error: "Informe login e senha." });
  }

  const sql = `
    SELECT id, login, senha, tipo_usuario, ativo
    FROM usuario
    WHERE login = ? OR email = ?
    ORDER BY (login = ?) DESC
    LIMIT 1`;
  db.query(
    sql,
    [identificador, identificador, identificador],
    async (err, data) => {
      if (err) return res.status(500).json({ error: err.message });

      // Se não encontrou nenhum registro
      if (!data || data.length === 0) {
        return res.status(401).json({ error: "Usuário ou senha inválidos." });
      }

      const user = data[0];
      // Verifica se a senha está correta (senha com hash)
      const passwordMatches = await bcrypt.compare(senha, user.senha);
      if (!passwordMatches) {
        return res.status(401).json({ error: "Usuário ou senha inválidos." });
      }

      // Verifica se o usuário está ativo.
      if (user.ativo === 0) {
        return res.status(403).json({ error: "Usuário inativo." });
      }

      const token = jwt.sign(
        {
          id: user.id,
          login: user.login,
          tipo_usuario: user.tipo_usuario,
        },
        process.env.JWT_SECRET, // a chave secreta
        { expiresIn: "8h" }, // validade
      );

      return res.json({ token });
    },
  );
}

async function cadastrar(req, res) {
  const {
    login,
    senha,
    tipo,
    nome,
    cpf,
    telefone,
    data_nascimento,
    sexo,
    especializacao,
    email,
  } = req.body;
  const fotoPerfil = req.file
    ? `/imagens/foto_usuarios/${req.file.filename}`
    : null;

  const loginNormalizado = typeof login === "string" ? login.trim() : "";
  const emailNormalizado = typeof email === "string" ? email.trim() : "";

  if (!loginNormalizado || !senha || !emailNormalizado || !tipo) {
    removerFoto(req.file);
    return res.status(400).json({ error: "Informe todos os dados." });
  }

  if (tipo !== "responsavel" && tipo !== "cuidador") {
    removerFoto(req.file);
    return res.status(400).json({ error: "Tipo de usuário inválido." });
  }

  if (!nomeCompletoValido(nome)) {
    removerFoto(req.file);
    return res.status(400).json({ error: "Informe nome e sobrenome." });
  }

  if (!maiorDeIdade(data_nascimento)) {
    removerFoto(req.file);
    return res
      .status(400)
      .json({ error: "Cadastro permitido apenas para maiores de 18 anos." });
  }

  let conexao;
  let transacaoIniciada = false;

  try {
    const hash = await bcrypt.hash(senha, 10); // incriptar senha
    const date = new Date();
    conexao = await abrirTransacaoExclusiva();
    transacaoIniciada = true;

    const usuarioResult = await executarConsultaNaConexao(
      conexao,
      "INSERT INTO usuario (id, login, senha, email, tipo_usuario, ativo, criado_em, foto_perfil) VALUES (DEFAULT, ?, ?, ?, ?, 1, ?, ?)",
      [loginNormalizado, hash, emailNormalizado, tipo, date, fotoPerfil],
    );

    const sqlPerfil =
      tipo === "responsavel"
        ? "INSERT INTO responsavel (id, usuario_id, nome, cpf, telefone, data_nascimento, sexo) VALUES (DEFAULT, ?, ?, ?, ?, ?, ?)"
        : "INSERT INTO cuidador (id, usuario_id, nome, sexo, telefone, cpf, data_nascimento, especializacao) VALUES (DEFAULT, ?, ?, ?, ?, ?, ?, ?)";
    const parametrosPerfil =
      tipo === "responsavel"
        ? [
            usuarioResult.insertId,
            nome || null,
            cpf || null,
            telefone || null,
            data_nascimento || null,
            sexo || null,
          ]
        : [
            usuarioResult.insertId,
            nome || null,
            sexo || null,
            telefone || null,
            cpf || null,
            data_nascimento || null,
            especializacao || null,
          ];

    await executarConsultaNaConexao(conexao, sqlPerfil, parametrosPerfil);
    await new Promise((resolve, reject) => {
      conexao.commit((err) => (err ? reject(err) : resolve()));
    });
    transacaoIniciada = false;

    return res.status(201).json({
      mensagem: "Usuário criado",
      foto_perfil: fotoPerfil,
    });
  } catch (error) {
    if (transacaoIniciada) {
      await new Promise((resolve) => conexao.rollback(() => resolve()));
    }
    removerFoto(req.file);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "Usuário ou e-mail já cadastrado." });
    }
    console.error("Erro ao cadastrar usuário:", error);
    return res.status(500).json({ error: error.message });
  } finally {
    if (conexao) conexao.end();
  }
}

// Lista os pacientes relacionados a determinado usuário (responsável/cuidador)
function getPacientes(req, res) {
  const userId = req.user?.id;
  const tiposPermitidos = ["responsavel", "cuidador"];

  if (!userId) {
    return res.status(403).json({ error: "Usuário sem permissão." });
  }

  function buscarPacientes(userTipo) {
    if (!tiposPermitidos.includes(userTipo)) {
      return res.status(403).json({ error: "Usuário sem permissão." });
    }

    const sql = `
      SELECT p.*
      FROM ${userTipo}_paciente x
      JOIN ${userTipo} perfil ON perfil.id = x.${userTipo}_id
      JOIN paciente p ON x.paciente_id = p.id
      WHERE perfil.usuario_id = ?`;

    db.query(sql, [userId], (err, data) => {
      if (err) {
        console.error("Erro ao buscar pacientes:", err);
        return res.status(500).json({ error: "Erro interno do servidor." });
      }

      if (!data.length) return res.json([]);

      const pacienteIds = data.map((paciente) => paciente.id);
      db.query(
        `SELECT paciente_id
         FROM medicamento
         WHERE paciente_id IN (?) AND quantidade_comprimidos <= 5
         GROUP BY paciente_id`,
        [pacienteIds],
        (estoqueError, pacientesComEstoqueBaixo) => {
          if (estoqueError) {
            if (estoqueError.code === "ER_NO_SUCH_TABLE") {
              console.warn(
                "Tabela medicamento não encontrada; carregando pacientes sem indicadores de estoque.",
              );
              return res.json(
                data.map((paciente) => ({ ...paciente, estoque_baixo: 0 })),
              );
            }

            console.error(
              "Erro ao buscar estoque dos pacientes:",
              estoqueError,
            );
            return res.status(500).json({ error: "Erro interno do servidor." });
          }

          const idsComEstoqueBaixo = new Set(
            pacientesComEstoqueBaixo.map(({ paciente_id }) =>
              String(paciente_id),
            ),
          );
          return res.json(
            data.map((paciente) => ({
              ...paciente,
              estoque_baixo: Number(
                idsComEstoqueBaixo.has(String(paciente.id)),
              ),
            })),
          );
        },
      );
    });
  }

  const tipoDoToken = req.user.tipo_usuario || req.user.tipo;
  if (tipoDoToken) {
    return buscarPacientes(tipoDoToken);
  }

  // Compatibilidade com tokens emitidos antes de tipo_usuario ser incluído.
  db.query(
    "SELECT tipo_usuario, foto_perfil FROM usuario WHERE id = ?",
    [userId],
    (err, data) => {
      if (err) {
        console.error("Erro ao identificar usuário:", err);
        return res.status(500).json({ error: "Erro interno do servidor." });
      }

      if (!data || data.length === 0) {
        return res.status(403).json({ error: "Usuário sem permissão." });
      }

      return buscarPacientes(data[0].tipo_usuario);
    },
  );
}

function getPaciente(req, res) {
  const userId = req.user?.id;
  const pacienteId = req.params.id;
  const relacoes = relacoesPaciente;

  if (!userId || !/^\d+$/.test(pacienteId)) {
    return res
      .status(400)
      .json({ error: "Identificador de paciente inválido." });
  }

  function buscarPaciente(tipoUsuario) {
    const relacao = relacoes[tipoUsuario];
    if (!relacao) {
      return res.status(403).json({ error: "Usuário sem permissão." });
    }

    const sql = `
      SELECT p.*
      FROM paciente p
      JOIN ${relacao.tabelaRelacao} x ON x.paciente_id = p.id
      JOIN ${relacao.tabelaPerfil} perfil ON perfil.id = x.${relacao.colunaPerfil}
      WHERE perfil.usuario_id = ? AND p.id = ?
      LIMIT 1`;

    db.query(sql, [userId, pacienteId], (err, pacientes) => {
      if (err) {
        console.error("Erro ao buscar paciente:", err);
        return res.status(500).json({ error: "Erro interno do servidor." });
      }

      if (!pacientes || pacientes.length === 0) {
        return res.status(404).json({ error: "Paciente não encontrado." });
      }

      return res.json({ ...pacientes[0], tipo_usuario: tipoUsuario });
    });
  }

  const tipoDoToken = req.user.tipo_usuario || req.user.tipo;
  if (tipoDoToken) return buscarPaciente(tipoDoToken);

  db.query(
    "SELECT tipo_usuario FROM usuario WHERE id = ?",
    [userId],
    (err, usuarios) => {
      if (err) {
        return res.status(500).json({ error: "Erro interno do servidor." });
      }
      if (!usuarios || usuarios.length === 0) {
        return res.status(403).json({ error: "Usuário sem permissão." });
      }
      return buscarPaciente(usuarios[0].tipo_usuario);
    },
  );
}

async function atualizarPaciente(req, res) {
  const usuarioId = req.user?.id;
  const pacienteId = req.params.id;
  const tipoUsuario = req.user?.tipo_usuario || req.user?.tipo;
  const relacoes = {
    responsavel: {
      tabelaPerfil: "responsavel",
      tabelaRelacao: "responsavel_paciente",
      colunaPerfil: "responsavel_id",
    },
    cuidador: {
      tabelaPerfil: "cuidador",
      tabelaRelacao: "cuidador_paciente",
      colunaPerfil: "cuidador_id",
    },
  };
  const relacao = relacoes[tipoUsuario];
  const nome = typeof req.body.nome === "string" ? req.body.nome.trim() : "";
  const cpf = typeof req.body.cpf === "string" ? req.body.cpf.trim() : "";
  const dataNascimento = req.body.data_nascimento || null;
  const telefone =
    typeof req.body.telefone === "string" ? req.body.telefone.trim() : "";
  const endereco =
    typeof req.body.endereco === "string" ? req.body.endereco.trim() : "";
  const statusAtencao = req.body.status_atencao;
  const observacoes =
    typeof req.body.observacoes === "string" ? req.body.observacoes.trim() : "";

  function responderErro(status, mensagem) {
    removerFoto(req.file);
    return res.status(status).json({ error: mensagem });
  }

  if (!usuarioId || !relacao || !/^\d+$/.test(pacienteId)) {
    return responderErro(
      403,
      "Usuário sem permissão para editar este paciente.",
    );
  }

  if (!nome || nome.length > 150 || !/^\d{11}$/.test(cpf)) {
    return responderErro(
      400,
      "Informe um nome e um CPF válido com 11 dígitos.",
    );
  }

  if (telefone.length > 20) {
    return responderErro(400, "O telefone deve ter no máximo 20 caracteres.");
  }

  if (dataNascimento && !/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento)) {
    return responderErro(400, "Informe uma data de nascimento válida.");
  }

  if (!["Estável", "Atenção", "Crítico"].includes(statusAtencao)) {
    return responderErro(400, "Selecione um estado de atenção válido.");
  }

  let transacaoIniciada = false;
  let conexao;
  let fotoAnterior = null;
  let fotoAtualizada = null;

  try {
    conexao = await abrirTransacaoExclusiva();
    transacaoIniciada = true;

    const pacientes = await executarConsultaNaConexao(
      conexao,
      `SELECT p.foto
       FROM paciente p
       JOIN ${relacao.tabelaRelacao} x ON x.paciente_id = p.id
       JOIN ${relacao.tabelaPerfil} perfil ON perfil.id = x.${relacao.colunaPerfil}
       WHERE p.id = ? AND perfil.usuario_id = ?
       LIMIT 1 FOR UPDATE`,
      [pacienteId, usuarioId],
    );

    if (!pacientes.length) {
      const erro = new Error("Paciente não encontrado.");
      erro.status = 404;
      throw erro;
    }

    fotoAnterior = pacientes[0].foto;
    fotoAtualizada = req.file
      ? `/imagens/foto_pacientes/${req.file.filename}`
      : req.body.remover_foto === "true"
        ? null
        : fotoAnterior;

    await executarConsultaNaConexao(
      conexao,
      `UPDATE paciente
       SET nome = ?, cpf = ?, data_nascimento = ?, telefone = ?, endereco = ?,
           status_atencao = ?, observacoes = ?, foto = ?
       WHERE id = ?`,
      [
        nome,
        cpf,
        dataNascimento,
        telefone || null,
        endereco || null,
        statusAtencao,
        observacoes || null,
        fotoAtualizada,
        pacienteId,
      ],
    );

    await new Promise((resolve, reject) => {
      conexao.commit((err) => (err ? reject(err) : resolve()));
    });
    transacaoIniciada = false;

    if (fotoAnterior && fotoAnterior !== fotoAtualizada) {
      removerFotoPacienteAnterior(fotoAnterior);
    }

    return res.json({
      message: "Perfil do paciente atualizado com sucesso.",
      paciente: {
        id: Number(pacienteId),
        nome,
        cpf,
        data_nascimento: dataNascimento,
        telefone: telefone || null,
        endereco: endereco || null,
        status_atencao: statusAtencao,
        observacoes: observacoes || null,
        foto: fotoAtualizada,
      },
    });
  } catch (error) {
    if (transacaoIniciada) {
      await new Promise((resolve) => conexao.rollback(() => resolve()));
    }
    removerFoto(req.file);

    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "Já existe um paciente com este CPF." });
    }

    console.error("Erro ao atualizar paciente:", error);
    return res.status(error.status || 500).json({
      error: error.status ? error.message : "Erro ao atualizar paciente.",
    });
  } finally {
    if (conexao) conexao.end();
  }
}

async function excluirPaciente(req, res) {
  const usuarioId = req.user?.id;
  const pacienteId = req.params.id;
  const tipoUsuario = req.user?.tipo_usuario || req.user?.tipo;
  const relacoes = {
    responsavel: {
      tabelaPerfil: "responsavel",
      tabelaRelacao: "responsavel_paciente",
      colunaPerfil: "responsavel_id",
    },
    cuidador: {
      tabelaPerfil: "cuidador",
      tabelaRelacao: "cuidador_paciente",
      colunaPerfil: "cuidador_id",
    },
  };
  const relacao = relacoes[tipoUsuario];

  if (!usuarioId || !relacao || !/^\d+$/.test(pacienteId)) {
    return res.status(403).json({ error: "Usuário sem permissão." });
  }

  let transacaoIniciada = false;
  let conexao;
  let fotoPaciente = null;

  try {
    conexao = await abrirTransacaoExclusiva();
    transacaoIniciada = true;

    const pacientes = await executarConsultaNaConexao(
      conexao,
      `SELECT p.foto
       FROM paciente p
       JOIN ${relacao.tabelaRelacao} x ON x.paciente_id = p.id
       JOIN ${relacao.tabelaPerfil} perfil ON perfil.id = x.${relacao.colunaPerfil}
       WHERE p.id = ? AND perfil.usuario_id = ?
       LIMIT 1 FOR UPDATE`,
      [pacienteId, usuarioId],
    );

    if (!pacientes.length) {
      const erro = new Error("Paciente não encontrado.");
      erro.status = 404;
      throw erro;
    }

    fotoPaciente = pacientes[0].foto;
    await executarConsultaNaConexao(
      conexao,
      "DELETE FROM paciente WHERE id = ?",
      [pacienteId],
    );

    await new Promise((resolve, reject) => {
      conexao.commit((err) => (err ? reject(err) : resolve()));
    });
    transacaoIniciada = false;

    removerFotoPacienteAnterior(fotoPaciente);
    return res.json({ message: "Paciente excluído com sucesso." });
  } catch (error) {
    if (transacaoIniciada) {
      await new Promise((resolve) => conexao.rollback(() => resolve()));
    }

    console.error("Erro ao excluir paciente:", error);
    return res.status(error.status || 500).json({
      error: error.status ? error.message : "Erro ao excluir paciente.",
    });
  } finally {
    if (conexao) conexao.end();
  }
}

async function cadastrarPaciente(req, res) {
  const usuarioId = req.user?.id;
  const tipoUsuario = req.user?.tipo_usuario || req.user?.tipo;
  const perfis = {
    responsavel: {
      tabela: "responsavel",
      relacionamento: "responsavel_paciente",
      colunaRelacionamento: "responsavel_id",
    },
  };
  const perfil = perfis[tipoUsuario];
  const nome = typeof req.body.nome === "string" ? req.body.nome.trim() : "";
  const cpf = typeof req.body.cpf === "string" ? req.body.cpf.trim() : "";
  const telefone =
    typeof req.body.telefone === "string" ? req.body.telefone.trim() : "";
  const endereco =
    typeof req.body.endereco === "string" ? req.body.endereco.trim() : "";
  const observacoes =
    typeof req.body.observacoes === "string" ? req.body.observacoes.trim() : "";
  const dataNascimento = req.body.data_nascimento || null;
  const sexo = req.body.sexo || null;
  const statusAtencao = req.body.status_atencao || "Estável";
  const foto = req.file ? `/imagens/foto_pacientes/${req.file.filename}` : null;

  function responderErro(status, mensagem) {
    removerFoto(req.file);
    return res.status(status).json({ error: mensagem });
  }

  if (!usuarioId || !perfil) {
    return responderErro(
      403,
      "Usuário sem permissão para cadastrar pacientes.",
    );
  }

  if (!nome || nome.length > 150 || !/^\d{11}$/.test(cpf)) {
    return responderErro(
      400,
      "Informe um nome e um CPF válido com 11 dígitos.",
    );
  }

  if (telefone.length > 20) {
    return responderErro(400, "O telefone deve ter no máximo 20 caracteres.");
  }

  if (sexo && !["M", "F", "Outro"].includes(sexo)) {
    return responderErro(400, "Selecione uma opção de sexo válida.");
  }

  if (!["Estável", "Atenção", "Crítico"].includes(statusAtencao)) {
    return responderErro(400, "Selecione um estado de atenção válido.");
  }

  if (dataNascimento && !/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento)) {
    return responderErro(400, "Informe uma data de nascimento válida.");
  }

  let transacaoIniciada = false;
  let conexao;

  try {
    conexao = await abrirTransacaoExclusiva();
    transacaoIniciada = true;

    const registrosPerfil = await executarConsultaNaConexao(
      conexao,
      `SELECT id FROM ${perfil.tabela} WHERE usuario_id = ? LIMIT 1`,
      [usuarioId],
    );

    if (!registrosPerfil.length) {
      const erro = new Error("Perfil de usuário não encontrado.");
      erro.status = 403;
      throw erro;
    }

    const pacienteResult = await executarConsultaNaConexao(
      conexao,
      `INSERT INTO paciente
        (nome, cpf, data_nascimento, sexo, telefone, endereco,
         status_atencao, observacoes, foto)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nome,
        cpf,
        dataNascimento,
        sexo,
        telefone || null,
        endereco || null,
        statusAtencao,
        observacoes || null,
        foto,
      ],
    );

    const relacaoParams = [registrosPerfil[0].id, pacienteResult.insertId];
    await executarConsultaNaConexao(
      conexao,
      `INSERT INTO ${perfil.relacionamento}
        (${perfil.colunaRelacionamento}, paciente_id)
       VALUES (?, ?)`,
      relacaoParams,
    );

    await new Promise((resolve, reject) => {
      conexao.commit((err) => (err ? reject(err) : resolve()));
    });
    transacaoIniciada = false;

    return res.status(201).json({
      id: pacienteResult.insertId,
      message: "Paciente cadastrado com sucesso.",
    });
  } catch (error) {
    if (transacaoIniciada) {
      await new Promise((resolve) => conexao.rollback(() => resolve()));
    }
    removerFoto(req.file);

    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "Já existe um paciente com este CPF." });
    }

    console.error("Erro ao cadastrar paciente:", error);
    return res.status(error.status || 500).json({
      error: error.status ? error.message : "Erro ao cadastrar paciente.",
    });
  } finally {
    if (conexao) conexao.end();
  }
}

function getPerfil(req, res) {
  const sql = `
    SELECT u.id, u.login, u.email, u.tipo_usuario, u.criado_em, u.foto_perfil,
	  COALESCE(r.nome, c.nome) as nome,
    COALESCE(r.cpf, c.cpf) as cpf,
    COALESCE(r.telefone, c.telefone) as telefone,
    COALESCE(r.data_nascimento, c.data_nascimento) as data_nascimento,
    COALESCE(r.sexo, c.sexo) as sexo
    FROM usuario u
    LEFT JOIN responsavel r ON r.usuario_id = u.id
    LEFT JOIN cuidador c ON c.usuario_id = u.id
    WHERE u.id = ?`;

  db.query(sql, [req.user?.id], (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Erro interno do servidor." });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Perfil não encontrado." });
    }

    return res.json(data[0]);
  });
}

async function getMedicamentos(req, res) {
  const usuarioId = req.user?.id;
  const tipo = tipoUsuario(req);
  const pacienteId = req.params.id;
  const data = req.query.data;

  if (!dataValida(data)) {
    return res.status(400).json({ error: "Informe uma data válida." });
  }
  try {
    if (!(await usuarioTemAcessoAoPaciente(usuarioId, tipo, pacienteId))) {
      return res.status(403).json({ error: "Usuário sem acesso ao paciente." });
    }

    const medicamentos = await executarConsulta(
      `SELECT id, nome, quantidade_comprimidos, criado_em
         FROM medicamento
        WHERE paciente_id = ?
        ORDER BY nome`,
      [pacienteId],
    );

    if (!medicamentos.length) return res.json([]);

    const ids = medicamentos.map((medicamento) => medicamento.id);
    const horarios = await executarConsulta(
      `SELECT h.id, h.medicamento_id,
              TIME_FORMAT(h.horario, '%H:%i') AS horario,
              a.id AS administracao_id,
              a.administrado_em
         FROM medicamento_horario h
         LEFT JOIN administracao_medicamento a
           ON a.medicamento_horario_id = h.id
          AND a.data_referencia = ?
        WHERE h.medicamento_id IN (?)
        ORDER BY h.horario`,
      [data, ids],
    );

    const horariosPorMedicamento = new Map();
    for (const horario of horarios) {
      const lista = horariosPorMedicamento.get(horario.medicamento_id) || [];
      lista.push({
        id: horario.id,
        horario: horario.horario,
        administrado: Boolean(horario.administracao_id),
        administrado_em: horario.administrado_em,
      });
      horariosPorMedicamento.set(horario.medicamento_id, lista);
    }

    return res.json(
      medicamentos.map((medicamento) => ({
        ...medicamento,
        horarios: horariosPorMedicamento.get(medicamento.id) || [],
      })),
    );
  } catch (error) {
    console.error("Erro ao buscar medicamentos:", error);
    return res.status(500).json({ error: "Erro ao buscar medicamentos." });
  }
}

async function cadastrarMedicamento(req, res) {
  const usuarioId = req.user?.id;
  const tipo = tipoUsuario(req);
  const pacienteId = req.params.id;
  const nome = typeof req.body.nome === "string" ? req.body.nome.trim() : "";
  const quantidade = Number(req.body.quantidade_comprimidos);
  const horarios = Array.isArray(req.body.horarios)
    ? [...new Set(req.body.horarios.map((horario) => String(horario).trim()))]
    : [];

  if (tipo !== "responsavel") {
    return res
      .status(403)
      .json({ error: "Somente o responsável pode adicionar medicamentos." });
  }
  if (!nome || nome.length > 150) {
    return res.status(400).json({ error: "Informe o nome do medicamento." });
  }
  if (
    !Number.isSafeInteger(quantidade) ||
    quantidade < 0 ||
    quantidade > 1000000
  ) {
    return res
      .status(400)
      .json({ error: "Informe uma quantidade válida de comprimidos." });
  }
  if (
    !horarios.length ||
    horarios.some((horario) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(horario))
  ) {
    return res
      .status(400)
      .json({ error: "Informe pelo menos um horário válido." });
  }

  let transacaoIniciada = false;
  let conexao;
  try {
    if (!(await usuarioTemAcessoAoPaciente(usuarioId, tipo, pacienteId))) {
      return res.status(403).json({ error: "Usuário sem acesso ao paciente." });
    }

    conexao = db.criarConexaoTransacional();
    await new Promise((resolve, reject) =>
      conexao.beginTransaction((error) => {
        if (error) return reject(error);
        transacaoIniciada = true;
        return resolve();
      }),
    );

    const resultado = await executarConsultaNaConexao(
      conexao,
      `INSERT INTO medicamento (paciente_id, nome, quantidade_comprimidos, criado_por)
       VALUES (?, ?, ?, ?)`,
      [pacienteId, nome, quantidade, usuarioId],
    );

    for (const horario of horarios.sort()) {
      const horarioResult = await executarConsultaNaConexao(
        conexao,
        "INSERT INTO medicamento_horario (medicamento_id, horario) VALUES (?, ?)",
        [resultado.insertId, horario],
      );

      await executarConsultaNaConexao(
        conexao,
        `INSERT INTO tarefa
          (paciente_id, titulo, descricao, tipo, dia_semana, data_especifica,
           origem, medicamento_horario_id, criado_por, ativo)
         VALUES (?, ?, ?, 'diaria', NULL, NULL, 'medicamento', ?, ?, 1)`,
        [
          pacienteId,
          `Administrar ${nome} às ${horario}`.slice(0, 150),
          `Administrar ${nome} conforme a prescrição.`,
          horarioResult.insertId,
          usuarioId,
        ],
      );
    }

    await new Promise((resolve, reject) =>
      conexao.commit((error) => (error ? reject(error) : resolve())),
    );
    transacaoIniciada = false;
    return res
      .status(201)
      .json({ id: resultado.insertId, message: "Medicamento adicionado." });
  } catch (error) {
    if (transacaoIniciada) {
      await new Promise((resolve) => conexao.rollback(() => resolve()));
    }
    console.error("Erro ao cadastrar medicamento:", error);
    return res.status(500).json({ error: "Erro ao cadastrar medicamento." });
  } finally {
    if (conexao) conexao.end();
  }
}

async function removerMedicamento(req, res) {
  const usuarioId = req.user?.id;
  const tipo = tipoUsuario(req);
  const { id: pacienteId, medicamentoId } = req.params;

  if (tipo !== "responsavel") {
    return res
      .status(403)
      .json({ error: "Somente o responsável pode remover medicamentos." });
  }

  try {
    if (!(await usuarioTemAcessoAoPaciente(usuarioId, tipo, pacienteId))) {
      return res.status(403).json({ error: "Usuário sem acesso ao paciente." });
    }
    const resultado = await executarConsulta(
      "DELETE FROM medicamento WHERE id = ? AND paciente_id = ?",
      [medicamentoId, pacienteId],
    );
    if (!resultado.affectedRows) {
      return res.status(404).json({ error: "Medicamento não encontrado." });
    }
    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao remover medicamento:", error);
    return res.status(500).json({ error: "Erro ao remover medicamento." });
  }
}

async function adicionarEstoque(req, res) {
  const usuarioId = req.user?.id;
  const tipo = tipoUsuario(req);
  const { id: pacienteId, medicamentoId } = req.params;
  const quantidade = Number(req.body.quantidade);

  if (tipo !== "responsavel") {
    return res
      .status(403)
      .json({ error: "Somente o responsável pode adicionar estoque." });
  }
  if (
    !Number.isSafeInteger(quantidade) ||
    quantidade <= 0 ||
    quantidade > 1000000
  ) {
    return res
      .status(400)
      .json({ error: "Informe uma quantidade maior que zero." });
  }

  try {
    if (!(await usuarioTemAcessoAoPaciente(usuarioId, tipo, pacienteId))) {
      return res.status(403).json({ error: "Usuário sem acesso ao paciente." });
    }
    const resultado = await executarConsulta(
      `UPDATE medicamento
          SET quantidade_comprimidos = quantidade_comprimidos + ?
        WHERE id = ? AND paciente_id = ?`,
      [quantidade, medicamentoId, pacienteId],
    );
    if (!resultado.affectedRows) {
      return res.status(404).json({ error: "Medicamento não encontrado." });
    }
    return res.json({ message: "Estoque atualizado." });
  } catch (error) {
    console.error("Erro ao adicionar estoque:", error);
    return res.status(500).json({ error: "Erro ao adicionar estoque." });
  }
}

async function registrarAdministracao(req, res) {
  const usuarioId = req.user?.id;
  const tipo = tipoUsuario(req);
  const { id: pacienteId, medicamentoId, horarioId } = req.params;
  const { data } = req.body;

  if (tipo !== "cuidador" && tipo !== "responsavel") {
    return res
      .status(403)
      .json({
        error: "Somente o responsável ou cuidador pode registrar uma dose.",
      });
  }
  if (!dataValida(data)) {
    return res.status(400).json({ error: "Informe uma data válida." });
  }
  if (data !== dataAtualLocal()) {
    return res
      .status(400)
      .json({ error: "Só é possível registrar doses do dia atual." });
  }

  let transacaoIniciada = false;
  let conexao;
  try {
    if (!(await usuarioTemAcessoAoPaciente(usuarioId, tipo, pacienteId))) {
      return res.status(403).json({ error: "Usuário sem acesso ao paciente." });
    }

    conexao = db.criarConexaoTransacional();
    await new Promise((resolve, reject) =>
      conexao.beginTransaction((error) => {
        if (error) return reject(error);
        transacaoIniciada = true;
        return resolve();
      }),
    );

    const horario = await executarConsultaNaConexao(
      conexao,
      `SELECT h.id
         FROM medicamento_horario h
         JOIN medicamento m ON m.id = h.medicamento_id
        WHERE h.id = ? AND m.id = ? AND m.paciente_id = ?
        LIMIT 1`,
      [horarioId, medicamentoId, pacienteId],
    );
    if (!horario.length) {
      const erro = new Error("Horário não encontrado.");
      erro.status = 404;
      throw erro;
    }

    await executarConsultaNaConexao(
      conexao,
      `INSERT INTO administracao_medicamento
        (medicamento_horario_id, data_referencia, administrado_por)
       VALUES (?, ?, ?)`,
      [horarioId, data, usuarioId],
    );

    const estoque = await executarConsultaNaConexao(
      conexao,
      `UPDATE medicamento
          SET quantidade_comprimidos = quantidade_comprimidos - 1
        WHERE id = ? AND paciente_id = ? AND quantidade_comprimidos > 0`,
      [medicamentoId, pacienteId],
    );
    if (!estoque.affectedRows) {
      const erro = new Error("Não há comprimidos disponíveis no estoque.");
      erro.status = 409;
      throw erro;
    }

    await executarConsultaNaConexao(
      conexao,
      `INSERT INTO tarefa_ocorrencia
        (tarefa_id, data_referencia, concluida, concluida_por, concluida_em)
       SELECT t.id, ?, 1, ?, CURRENT_TIMESTAMP
         FROM tarefa t
        WHERE t.paciente_id = ?
          AND t.origem = 'medicamento'
          AND t.medicamento_horario_id = ?
          AND t.ativo = 1
       ON DUPLICATE KEY UPDATE
         concluida = VALUES(concluida),
         concluida_por = VALUES(concluida_por),
         concluida_em = VALUES(concluida_em)`,
      [data, usuarioId, pacienteId, horarioId],
    );

    await new Promise((resolve, reject) =>
      conexao.commit((error) => (error ? reject(error) : resolve())),
    );
    transacaoIniciada = false;
    return res
      .status(201)
      .json({ message: "Dose registrada e estoque atualizado." });
  } catch (error) {
    if (transacaoIniciada) {
      await new Promise((resolve) => conexao.rollback(() => resolve()));
    }
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "Esta dose já foi registrada hoje." });
    }
    if (error.status)
      return res.status(error.status).json({ error: error.message });
    console.error("Erro ao registrar dose:", error);
    return res.status(500).json({ error: "Erro ao registrar dose." });
  } finally {
    if (conexao) conexao.end();
  }
}

async function getTarefas(req, res) {
  const usuarioId = req.user?.id;
  const tipo = tipoUsuario(req);
  const pacienteId = req.params.id;
  const data = req.query.data || dataAtualLocal();

  if (!dataValida(data)) {
    return res.status(400).json({ error: "Informe uma data válida." });
  }

  try {
    if (!(await usuarioTemAcessoAoPaciente(usuarioId, tipo, pacienteId))) {
      return res.status(403).json({ error: "Usuário sem acesso ao paciente." });
    }

    const tarefas = await executarConsulta(
      `SELECT t.id, t.titulo, t.descricao, t.tipo, t.dia_semana,
              t.data_especifica, t.origem, t.medicamento_horario_id,
              mh.horario AS horario,
              m.id AS medicamento_id,
              COALESCE(o.concluida, 0) AS concluida
         FROM tarefa t
         LEFT JOIN tarefa_ocorrencia o
           ON o.tarefa_id = t.id AND o.data_referencia = ?
         LEFT JOIN medicamento_horario mh
           ON mh.id = t.medicamento_horario_id
         LEFT JOIN medicamento m ON m.id = mh.medicamento_id
        WHERE t.paciente_id = ?
          AND t.ativo = 1
          AND (
            t.tipo = 'diaria'
            OR (t.tipo = 'semanal' AND t.dia_semana = WEEKDAY(?) + 1)
            OR (t.tipo = 'unica' AND t.data_especifica = ?)
          )
        ORDER BY (mh.horario IS NULL), mh.horario, t.titulo`,
      [data, pacienteId, data, data],
    );

    return res.json(
      tarefas.map((tarefa) => ({
        ...tarefa,
        concluida: Boolean(tarefa.concluida),
      })),
    );
  } catch (error) {
    console.error("Erro ao buscar tarefas:", error);
    return res.status(500).json({ error: "Erro ao buscar tarefas." });
  }
}

async function cadastrarTarefa(req, res) {
  const usuarioId = req.user?.id;
  const tipoUsuarioAtual = tipoUsuario(req);
  const pacienteId = req.params.id;
  const titulo =
    typeof req.body.titulo === "string" ? req.body.titulo.trim() : "";
  const descricao =
    typeof req.body.descricao === "string" ? req.body.descricao.trim() : "";
  const tipo = req.body.tipo;
  const diaSemana = Number(req.body.dia_semana);
  const dataEspecifica = req.body.data_especifica || null;

  if (tipoUsuarioAtual !== "responsavel") {
    return res
      .status(403)
      .json({ error: "Somente o responsável pode adicionar tarefas." });
  }
  if (!titulo || titulo.length > 150) {
    return res
      .status(400)
      .json({ error: "Informe um título de até 150 caracteres." });
  }
  if (!["diaria", "semanal", "unica"].includes(tipo)) {
    return res.status(400).json({ error: "Selecione a frequência da tarefa." });
  }
  if (
    tipo === "semanal" &&
    (!Number.isInteger(diaSemana) || diaSemana < 1 || diaSemana > 7)
  ) {
    return res
      .status(400)
      .json({ error: "Selecione um dia da semana válido." });
  }
  if (tipo === "unica" && !dataValida(dataEspecifica)) {
    return res
      .status(400)
      .json({ error: "Selecione uma data válida para a tarefa." });
  }
  if (tipo === "unica" && dataEspecifica < dataAtualLocal()) {
    return res
      .status(400)
      .json({ error: "A data da tarefa não pode estar no passado." });
  }

  try {
    if (
      !(await usuarioTemAcessoAoPaciente(
        usuarioId,
        tipoUsuarioAtual,
        pacienteId,
      ))
    ) {
      return res.status(403).json({ error: "Usuário sem acesso ao paciente." });
    }

    const resultado = await executarConsulta(
      `INSERT INTO tarefa
        (paciente_id, titulo, descricao, tipo, dia_semana, data_especifica,
         origem, medicamento_horario_id, criado_por, ativo)
       VALUES (?, ?, ?, ?, ?, ?, 'manual', NULL, ?, 1)`,
      [
        pacienteId,
        titulo,
        descricao || null,
        tipo,
        tipo === "semanal" ? diaSemana : null,
        tipo === "unica" ? dataEspecifica : null,
        usuarioId,
      ],
    );

    return res.status(201).json({
      id: resultado.insertId,
      message: "Tarefa adicionada com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao cadastrar tarefa:", error);
    return res.status(500).json({ error: "Erro ao cadastrar tarefa." });
  }
}

async function atualizarConclusaoTarefa(req, res) {
  const usuarioId = req.user?.id;
  const tipo = tipoUsuario(req);
  const pacienteId = req.params.id;
  const tarefaId = req.params.tarefaId;
  const { data, concluida } = req.body;

  if (!dataValida(data) || data !== dataAtualLocal()) {
    return res
      .status(400)
      .json({ error: "Só é possível atualizar tarefas do dia atual." });
  }
  if (typeof concluida !== "boolean") {
    return res
      .status(400)
      .json({ error: "Informe o estado de conclusão da tarefa." });
  }

  try {
    if (!(await usuarioTemAcessoAoPaciente(usuarioId, tipo, pacienteId))) {
      return res.status(403).json({ error: "Usuário sem acesso ao paciente." });
    }

    const tarefas = await executarConsulta(
      `SELECT id
         FROM tarefa
        WHERE id = ? AND paciente_id = ? AND ativo = 1 AND origem = 'manual'
          AND (
            tipo = 'diaria'
            OR (tipo = 'semanal' AND dia_semana = WEEKDAY(?) + 1)
            OR (tipo = 'unica' AND data_especifica = ?)
          )
        LIMIT 1`,
      [tarefaId, pacienteId, data, data],
    );
    if (!tarefas.length) {
      return res
        .status(404)
        .json({ error: "Tarefa não encontrada para hoje." });
    }

    await executarConsulta(
      `INSERT INTO tarefa_ocorrencia
        (tarefa_id, data_referencia, concluida, concluida_por, concluida_em)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         concluida = VALUES(concluida),
         concluida_por = VALUES(concluida_por),
         concluida_em = VALUES(concluida_em)`,
      [
        tarefaId,
        data,
        Number(concluida),
        concluida ? usuarioId : null,
        concluida ? new Date() : null,
      ],
    );

    return res.json({ message: "Tarefa atualizada.", concluida });
  } catch (error) {
    console.error("Erro ao atualizar tarefa:", error);
    return res.status(500).json({ error: "Erro ao atualizar tarefa." });
  }
}

function atualizarPerfil(req, res) {
  const userId = req.user?.id;
  const { nome, email, cpf, telefone, data_nascimento, sexo } = req.body;
  const fotoPerfil = req.file
    ? `/imagens/foto_usuarios/${req.file.filename}`
    : null;
  const dadosObrigatorios = [nome, email, cpf, telefone, data_nascimento, sexo];

  function responderErro(status, mensagem) {
    removerFoto(req.file);
    return res.status(status).json({ error: mensagem });
  }

  if (
    !userId ||
    dadosObrigatorios.some(
      (valor) => typeof valor !== "string" || !valor.trim(),
    )
  ) {
    return responderErro(400, "Informe todos os dados do perfil.");
  }

  if (!nomeCompletoValido(nome)) {
    return responderErro(400, "Informe nome e sobrenome.");
  }

  if (!["M", "F", "Outro"].includes(sexo)) {
    return responderErro(400, "Selecione uma opção de sexo válida.");
  }

  db.query(
    "SELECT tipo_usuario, foto_perfil FROM usuario WHERE id = ?",
    [userId],
    (err, usuarios) => {
      if (err) return responderErro(500, err.message);
      if (!usuarios || usuarios.length === 0) {
        return responderErro(404, "Perfil não encontrado.");
      }

      const tabelaPerfil = {
        responsavel: "responsavel",
        cuidador: "cuidador",
      }[usuarios[0].tipo_usuario];

      if (!tabelaPerfil) {
        return responderErro(400, "Tipo de usuário inválido.");
      }

      if (fotoPerfil && usuarios[0].foto_perfil !== fotoPerfil) {
        removerFotoPerfilAnterior(usuarios[0].foto_perfil);
      }

      const sql = `
        UPDATE usuario u
        JOIN ${tabelaPerfil} p ON p.usuario_id = u.id
        SET u.email = ?, u.foto_perfil = COALESCE(?, u.foto_perfil),
            p.nome = ?, p.cpf = ?, p.telefone = ?,
            p.data_nascimento = ?, p.sexo = ?
        WHERE u.id = ?`;

      db.query(
        sql,
        [
          email.trim(),
          fotoPerfil,
          nome.trim(),
          cpf.trim(),
          telefone.trim(),
          data_nascimento,
          sexo,
          userId,
        ],
        (updateError) => {
          if (updateError) {
            if (updateError.code === "ER_DUP_ENTRY") {
              return responderErro(409, "Este e-mail já está cadastrado.");
            }
            return responderErro(500, updateError.message);
          }

          return res.json({
            message: "Perfil atualizado com sucesso.",
            foto_perfil: fotoPerfil || usuarios[0].foto_perfil,
          });
        },
      );
    },
  );
}

// Altera a senha atual substituindo por uma nova
function alterarSenha(req, res) {
  const { senha, newSenha } = req.body;
  const userId = req.user?.id;

  if (!userId || !senha || !newSenha) {
    return res.status(400).json({ error: "Informe todas as senhas." });
  }

  // busca o hash do usuario no banco
  const sql = "SELECT senha FROM usuario WHERE id = ?";
  db.query(sql, [userId], async (err, data) => {
    if (err) return res.status(500).json({ error: err.message });

    // Se não encontrou nenhum registro
    if (!data || data.length === 0) {
      return res.status(401).json({ error: "Usuário inválido!" });
    }

    const user = data[0];
    // Verifica se a senha está correta (senha com hash)
    const passwordMatches = await bcrypt.compare(senha, user.senha);
    if (!passwordMatches) {
      return res.status(401).json({ error: "senha inválida" });
    } else {
      const hashedNewPassword = await bcrypt.hash(newSenha, 10);
      const sql2 = "UPDATE usuario SET senha = ? WHERE usuario.id = ?";
      db.query(sql2, [hashedNewPassword, userId], (err, data) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        return res.json({ message: "Senha alterada com sucesso!" });
      });
    }
  });
}

module.exports = {
  login,
  cadastrar,
  getPacientes,
  getPaciente,
  atualizarPaciente,
  excluirPaciente,
  cadastrarPaciente,
  getPerfil,
  atualizarPerfil,
  alterarSenha,
  getMedicamentos,
  cadastrarMedicamento,
  removerMedicamento,
  adicionarEstoque,
  registrarAdministracao,
  getTarefas,
  cadastrarTarefa,
  atualizarConclusaoTarefa,
};
