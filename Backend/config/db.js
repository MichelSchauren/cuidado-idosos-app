// Conexão com o BANCO
const mysql = require("mysql2");

const configuracao = {
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
};

const db = mysql.createPool({
  ...configuracao,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  maxIdle: 5,
  idleTimeout: 4 * 60 * 1000,
});

db.criarConexaoTransacional = () =>
  new Promise((resolve, reject) => {
    db.getConnection((err, conexao) => {
      if (err) return reject(err);
      return resolve(conexao);
    });
  });

module.exports = db;
