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

  try {
    const hash = await bcrypt.hash(senha, 10); // incriptar senha
    const date = new Date();

    db.beginTransaction((err) => {
      if (err) return res.status(500).json({ error: err.message });

      const sql =
        "INSERT INTO usuario (id, login, senha, email, tipo_usuario, ativo, criado_em, foto_perfil) VALUES (DEFAULT, ?, ?, ?, ?, 1, ?, ?)";
      db.query(
        sql,
        [loginNormalizado, hash, emailNormalizado, tipo, date, fotoPerfil],
        (err, data) => {
          if (err) {
            removerFoto(req.file);
            return db.rollback(() => {
              if (err.code === "ER_DUP_ENTRY") {
                return res
                  .status(409)
                  .json({ error: "Usuário ou e-mail já cadastrado." });
              }
              return res.status(500).json({ error: err.message });
            });
          }

          const userId = data.insertId;
          const sql2 =
            tipo === "responsavel"
              ? "INSERT INTO responsavel (id, usuario_id, nome, cpf, telefone, data_nascimento, sexo) VALUES (DEFAULT, ?, ?, ?, ?, ?, ?)"
              : "INSERT INTO cuidador (id, usuario_id, nome, sexo, telefone, cpf, data_nascimento, especializacao) VALUES (DEFAULT, ?, ?, ?, ?, ?, ?, ?)";
          const params =
            tipo === "responsavel"
              ? [
                  userId,
                  nome || null,
                  cpf || null,
                  telefone || null,
                  data_nascimento || null,
                  sexo || null,
                ]
              : [
                  userId,
                  nome || null,
                  sexo || null,
                  telefone || null,
                  cpf || null,
                  data_nascimento || null,
                  especializacao || null,
                ];

          db.query(sql2, params, (err) => {
            if (err) {
              removerFoto(req.file);
              return db.rollback(() =>
                res.status(500).json({ error: err.message }),
              );
            }

            db.commit((err) => {
              if (err) {
                removerFoto(req.file);
                return db.rollback(() =>
                  res.status(500).json({ error: err.message }),
                );
              }

              res.status(201).json({
                mensagem: "Usuário criado",
                foto_perfil: fotoPerfil,
              });
            });
          });
        },
      );
    });
  } catch (error) {
    console.log(error.menssage);
    return res.status(500).json({ error: error.message });
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
      SELECT p.* FROM ${userTipo}_paciente x
      JOIN ${userTipo} perfil ON perfil.id = x.${userTipo}_id
      JOIN paciente p ON x.paciente_id = p.id
      WHERE perfil.usuario_id = ?`;

    db.query(sql, [userId], (err, data) => {
      if (err) {
        console.error("Erro ao buscar pacientes:", err);
        return res.status(500).json({ error: "Erro interno do servidor." });
      }

      return res.json(data);
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

      return res.json(pacientes[0]);
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
  let fotoAnterior = null;
  let fotoAtualizada = null;

  try {
    await new Promise((resolve, reject) => {
      db.beginTransaction((err) => {
        if (err) return reject(err);
        transacaoIniciada = true;
        return resolve();
      });
    });

    const pacientes = await executarConsulta(
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

    await executarConsulta(
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
      db.commit((err) => (err ? reject(err) : resolve()));
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
      await new Promise((resolve) => db.rollback(() => resolve()));
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
  let fotoPaciente = null;

  try {
    await new Promise((resolve, reject) => {
      db.beginTransaction((err) => {
        if (err) return reject(err);
        transacaoIniciada = true;
        return resolve();
      });
    });

    const pacientes = await executarConsulta(
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
    await executarConsulta("DELETE FROM paciente WHERE id = ?", [pacienteId]);

    await new Promise((resolve, reject) => {
      db.commit((err) => (err ? reject(err) : resolve()));
    });
    transacaoIniciada = false;

    removerFotoPacienteAnterior(fotoPaciente);
    return res.json({ message: "Paciente excluído com sucesso." });
  } catch (error) {
    if (transacaoIniciada) {
      await new Promise((resolve) => db.rollback(() => resolve()));
    }

    console.error("Erro ao excluir paciente:", error);
    return res
      .status(error.status || 500)
      .json({
        error: error.status ? error.message : "Erro ao excluir paciente.",
      });
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
    cuidador: {
      tabela: "cuidador",
      relacionamento: "cuidador_paciente",
      colunaRelacionamento: "cuidador_id",
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

  try {
    await new Promise((resolve, reject) => {
      db.beginTransaction((err) => {
        if (err) return reject(err);
        transacaoIniciada = true;
        return resolve();
      });
    });

    const registrosPerfil = await executarConsulta(
      `SELECT id FROM ${perfil.tabela} WHERE usuario_id = ? LIMIT 1`,
      [usuarioId],
    );

    if (!registrosPerfil.length) {
      const erro = new Error("Perfil de usuário não encontrado.");
      erro.status = 403;
      throw erro;
    }

    const pacienteResult = await executarConsulta(
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
    await executarConsulta(
      `INSERT INTO ${perfil.relacionamento}
        (${perfil.colunaRelacionamento}, paciente_id)
       VALUES (?, ?)`,
      relacaoParams,
    );

    await new Promise((resolve, reject) => {
      db.commit((err) => (err ? reject(err) : resolve()));
    });
    transacaoIniciada = false;

    return res.status(201).json({
      id: pacienteResult.insertId,
      message: "Paciente cadastrado com sucesso.",
    });
  } catch (error) {
    if (transacaoIniciada) {
      await new Promise((resolve) => db.rollback(() => resolve()));
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
  }
}

function getPerfil(req, res) {
  const sql = `
    SELECT u.id, u.login, u.email, u.criado_em, u.foto_perfil,
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
};
