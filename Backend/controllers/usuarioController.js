const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const db = require("../config/db");

function removerFoto(file) {
  if (file) {
    fs.unlink(file.path, () => {});
  }
}

// Login
function login(req, res) {
  // Recebe login e senha do frontend.
  const { login, senha } = req.body;

  // Verifica se os campos foram enviados.
  if (!login || !senha) {
    return res.status(400).json({ error: "Informe login e senha." });
  }

  // Busca no banco o usuário com o devido login
  const sql =
    "SELECT id, login, senha, tipo_usuario, ativo FROM usuario WHERE login = ?";
  db.query(sql, [login], async (err, data) => {
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
  });
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

  if (!login || !senha || !tipo) {
    removerFoto(req.file);
    return res.status(400).json({ error: "Informe todos os dados." });
  }

  if (tipo !== "responsavel" && tipo !== "cuidador") {
    removerFoto(req.file);
    return res.status(400).json({ error: "Tipo de usuário inválido." });
  }

  try {
    const hash = await bcrypt.hash(senha, 10); // incriptar senha
    const date = new Date();

    db.beginTransaction((err) => {
      if (err) return res.status(500).json({ error: err.message });

      const sql =
        "INSERT INTO usuario (id, login, senha, tipo_usuario, ativo, criado_em, foto_perfil) VALUES (DEFAULT, ?, ?, ?, 1, ?, ?)";
      db.query(sql, [login, hash, tipo, date, fotoPerfil], (err, data) => {
        if (err) {
          removerFoto(req.file);
          return db.rollback(() => {
            if (err.code === "ER_DUP_ENTRY") {
              return res.status(409).json({ error: "Usuário já existente." });
            }
            return res.status(500).json({ error: err.message });
          });
        }

        const userId = data.insertId;
        const sql2 =
          tipo === "responsavel"
            ? "INSERT INTO responsavel (id, usuario_id, nome, cpf, telefone, data_nascimento) VALUES (DEFAULT, ?, ?, ?, ?, ?)"
            : "INSERT INTO cuidador (id, usuario_id, nome, sexo, telefone, cpf, expecializacao) VALUES (DEFAULT, ?, ?, ?, ?, ?, ?)";
        const params =
          tipo === "responsavel"
            ? [
                userId,
                nome || null,
                cpf || null,
                telefone || null,
                data_nascimento || null,
              ]
            : [
                userId,
                nome || null,
                sexo || null,
                telefone || null,
                cpf || null,
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
      });
    });
  } catch (error) {
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
      JOIN paciente p ON x.paciente_id = p.id
      WHERE x.${userTipo}_id = ?`;

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
    "SELECT tipo_usuario FROM usuario WHERE id = ?",
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

module.exports = {
  login,
  cadastrar,
  getPacientes,
};
