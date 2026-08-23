require("dotenv").config();
const express = require("express");
const cors = require("cors");

const routes = require("./routes/usuarioRoutes");

const app = express();
app.use(cors());
// Permite que o backend receba dados JSON no corpo das requisições POST/PUT.
app.use(express.json());
app.use("/api", routes);

// // Conexão com o BANCO
// const db = mysql.createConnection({
//   host: process.env.HOST,
//   user: process.env.USER,
//   password: process.env.PASSWORD,
//   database: process.env.DATABASE,
// });

// Login
// app.post("/login", (req, res) => {
//   // Recebe login e senha do frontend.
//   const { login, senha } = req.body;

//   // Verifica se os campos foram enviados.
//   if (!login || !senha) {
//     return res.status(400).json({ error: "Informe login e senha." });
//   }

//   // Busca no banco o usuário com o devido login
//   const sql =
//     "SELECT id, login, senha, tipo_usuario, ativo FROM usuario WHERE login = ?";
//   db.query(sql, [login], async (err, data) => {
//     if (err) return res.status(500).json({ error: err.message });

//     // Se não encontrou nenhum registro
//     if (!data || data.length === 0) {
//       return res.status(401).json({ error: "Usuário ou senha inválidos." });
//     }

//     const user = data[0];
//     // Verifica se a senha está correta (senha com hash)
//     const passwordMatches = await bcrypt.compare(senha, user.senha);
//     if (!passwordMatches) {
//       return res.status(401).json({ error: "Usuário ou senha inválidos." });
//     }

//     // Verifica se o usuário está ativo.
//     if (user.ativo === 0) {
//       return res.status(403).json({ error: "Usuário inativo." });
//     }

//     const token = jwt.sign(
//       { id: user.id, login: user.login }, // o que vai "dentro" do token
//       process.env.JWT_SECRET, // a chave secreta
//       { expiresIn: "8h" }, // validade
//     );

//     return res.json({ token });
//   });
// });

// Cadastro
// app.post("/cadastro", async (req, res) => {
//   const {
//     login,
//     senha,
//     tipo,
//     nome,
//     cpf,
//     telefone,
//     data_nascimento,
//     sexo,
//     especializacao,
//   } = req.body;

//   if (!login || !senha || !tipo) {
//     return res.status(400).json({ error: "Informe todos os dados." });
//   }

//   if (tipo !== "responsavel" && tipo !== "cuidador") {
//     return res.status(400).json({ error: "Tipo de usuário inválido." });
//   }

//   try {
//     const hash = await bcrypt.hash(senha, 10); // incriptar senha
//     const date = new Date();

//     db.beginTransaction((err) => {
//       if (err) return res.status(500).json({ error: err.message });

//       const sql =
//         "INSERT INTO usuario (id, login, senha, tipo_usuario, ativo, criado_em) VALUES (DEFAULT, ?, ?, ?, 1, ?)";
//       db.query(sql, [login, hash, tipo, date], (err, data) => {
//         if (err) {
//           return db.rollback(() => {
//             if (err.code === "ER_DUP_ENTRY") {
//               return res.status(409).json({ error: "Usuário já existente." });
//             }
//             return res.status(500).json({ error: err.message });
//           });
//         }

//         const userId = data.insertId;
//         const sql2 =
//           tipo === "responsavel"
//             ? "INSERT INTO responsavel (id, usuario_id, nome, cpf, telefone, data_nascimento) VALUES (DEFAULT, ?, ?, ?, ?, ?)"
//             : "INSERT INTO cuidador (id, usuario_id, nome, sexo, telefone, cpf, expecializacao) VALUES (DEFAULT, ?, ?, ?, ?, ?, ?)";
//         const params =
//           tipo === "responsavel"
//             ? [
//                 userId,
//                 nome || null,
//                 cpf || null,
//                 telefone || null,
//                 data_nascimento || null,
//               ]
//             : [
//                 userId,
//                 nome || null,
//                 sexo || null,
//                 telefone || null,
//                 cpf || null,
//                 especializacao || null,
//               ];

//         db.query(sql2, params, (err) => {
//           if (err) {
//             return db.rollback(() =>
//               res.status(500).json({ error: err.message }),
//             );
//           }

//           db.commit((err) => {
//             if (err) {
//               return db.rollback(() =>
//                 res.status(500).json({ error: err.message }),
//               );
//             }

//             res.status(201).json({ mensagem: "Usuário criado" });
//           });
//         });
//       });
//     });
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
// });

// app.get("/validar-token", (req, res) => {
//   const authHeader = req.headers.authorization;
//   const token = authHeader && authHeader.split(" ")[1];

//   if (!token) {
//     return res.status(401).json({ error: "Não autorizado." });
//   }

//   jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//     if (err) {
//       return res.status(403).json({ error: "Token inválido." });
//     }
//     res.status(200).json({ message: "Acesso autorizado.", user });
//   });
// });

// Rodar servidor
app.listen(process.env.PORT, () => {
  console.log(`Servidor rodando na porta ${process.env.PORT}`);
});
