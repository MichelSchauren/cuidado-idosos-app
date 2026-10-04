const test = require("node:test");
const assert = require("node:assert/strict");

const controller = require("../controllers/usuarioController");
const db = require("../config/db");

function resposta() {
  return {
    statusCode: 200,
    body: undefined,
    status(codigo) {
      this.statusCode = codigo;
      return this;
    },
    json(conteudo) {
      this.body = conteudo;
      return this;
    },
  };
}

function requisicao(tipoUsuario = "responsavel") {
  return {
    user: { id: 1, tipo_usuario: tipoUsuario },
    params: { id: "1" },
    body: {
      medico: "Dr. Ricardo",
      especialidade: "Clínico geral",
      local: "Feliz-RS",
      data_hora: "2099-05-10T14:30",
      observacoes: "Levar exames.",
    },
  };
}

test("agendar consulta cria uma tarefa única vinculada na mesma transação", async () => {
  const consultaOriginal = db.query;
  const conexaoOriginal = db.criarConexaoTransacional;
  const operacoes = [];
  db.query = (_sql, _parametros, callback) => callback(null, [{ acesso: 1 }]);
  db.criarConexaoTransacional = () => ({
    beginTransaction(callback) {
      callback(null);
    },
    query(sql, parametros, callback) {
      operacoes.push({ sql, parametros });
      callback(null, { insertId: 42 });
    },
    commit(callback) {
      operacoes.push({ sql: "COMMIT" });
      callback(null);
    },
    rollback(callback) {
      operacoes.push({ sql: "ROLLBACK" });
      callback(null);
    },
    end() {},
  });

  const res = resposta();
  try {
    await controller.cadastrarConsulta(requisicao(), res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.id, 42);
    assert.match(operacoes[0].sql, /INSERT INTO consulta/);
    assert.equal(operacoes[0].parametros[4], "2099-05-10 14:30:00");
    assert.match(operacoes[1].sql, /INSERT INTO tarefa/);
    assert.match(operacoes[1].sql, /'unica'.*'consulta'/);
    assert.equal(operacoes[1].parametros[1], "Consulta com Dr. Ricardo");
    assert.match(operacoes[1].parametros[2], /Feliz-RS/);
    assert.match(operacoes[1].parametros[2], /Levar exames\./);
    assert.equal(operacoes[1].parametros[3], "2099-05-10");
    assert.equal(operacoes[1].parametros[4], 42);
    assert.equal(operacoes.at(-1).sql, "COMMIT");
  } finally {
    db.query = consultaOriginal;
    db.criarConexaoTransacional = conexaoOriginal;
  }
});

test("cuidador não pode agendar consulta", async () => {
  const res = resposta();
  await controller.cadastrarConsulta(requisicao("cuidador"), res);
  assert.equal(res.statusCode, 403);
});

test("consulta com data e hora inválidas é rejeitada antes de acessar o banco", async () => {
  const req = requisicao();
  req.body.data_hora = "2099-02-30T14:30";
  const res = resposta();
  await controller.cadastrarConsulta(req, res);
  assert.equal(res.statusCode, 400);
});

test("falha ao criar tarefa desfaz o cadastro da consulta", async () => {
  const consultaOriginal = db.query;
  const conexaoOriginal = db.criarConexaoTransacional;
  const operacoes = [];
  db.query = (_sql, _parametros, callback) => callback(null, [{ acesso: 1 }]);
  db.criarConexaoTransacional = () => ({
    beginTransaction(callback) {
      callback(null);
    },
    query(sql, _parametros, callback) {
      operacoes.push(sql);
      if (sql.includes("INSERT INTO tarefa")) {
        callback(new Error("Falha simulada"));
        return;
      }
      callback(null, { insertId: 42 });
    },
    commit(callback) {
      callback(null);
    },
    rollback(callback) {
      operacoes.push("ROLLBACK");
      callback(null);
    },
    end() {},
  });

  const res = resposta();
  const erroOriginal = console.error;
  console.error = () => {};
  try {
    await controller.cadastrarConsulta(requisicao(), res);
    assert.equal(res.statusCode, 500);
    assert.equal(operacoes.at(-1), "ROLLBACK");
  } finally {
    console.error = erroOriginal;
    db.query = consultaOriginal;
    db.criarConexaoTransacional = conexaoOriginal;
  }
});
