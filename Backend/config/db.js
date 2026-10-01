// Conexão com o BANCO
const mysql = require("mysql");

const configuracao = {
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
};

const db = mysql.createConnection(configuracao);

// Transações críticas usam uma conexão exclusiva para não misturar comandos
// de duas requisições simultâneas na conexão principal.
db.criarConexaoTransacional = () => mysql.createConnection(configuracao);

module.exports = db;
