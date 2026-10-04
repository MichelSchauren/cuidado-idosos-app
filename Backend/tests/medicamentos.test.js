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
    send() {
      return this;
    },
  };
}

test("cuidador não pode cadastrar medicamento", async () => {
  const res = resposta();
  await controller.cadastrarMedicamento(
    {
      user: { id: 2, tipo_usuario: "cuidador" },
      params: { id: "1" },
      body: { nome: "Teste", quantidade_comprimidos: 10, horarios: ["08:00"] },
    },
    res,
  );
  assert.equal(res.statusCode, 403);
});

test("cuidador não pode remover medicamento", async () => {
  const res = resposta();
  await controller.removerMedicamento(
    {
      user: { id: 2, tipo_usuario: "cuidador" },
      params: { id: "1", medicamentoId: "1" },
    },
    res,
  );
  assert.equal(res.statusCode, 403);
});

test("cuidador não pode adicionar estoque", async () => {
  const res = resposta();
  await controller.adicionarEstoque(
    {
      user: { id: 2, tipo_usuario: "cuidador" },
      params: { id: "1", medicamentoId: "1" },
      body: { quantidade: 10 },
    },
    res,
  );
  assert.equal(res.statusCode, 403);
});

test("responsável pode registrar uma dose e concluir sua tarefa", async () => {
  const consultaOriginal = db.query;
  const conexaoOriginal = db.criarConexaoTransacional;
  const data = new Date();
  const hoje = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;

  db.query = (_sql, _parametros, callback) => callback(null, [{ acesso: 1 }]);
  db.criarConexaoTransacional = () => ({
    beginTransaction(callback) {
      callback(null);
    },
    query(sql, _parametros, callback) {
      if (sql.includes("SELECT h.id")) {
        callback(null, [{ id: 1 }]);
        return;
      }
      if (sql.includes("UPDATE medicamento")) {
        callback(null, { affectedRows: 1 });
        return;
      }
      callback(null, { affectedRows: 1, insertId: 1 });
    },
    commit(callback) {
      callback(null);
    },
    rollback(callback) {
      callback(null);
    },
    end() {},
  });

  const res = resposta();
  try {
    await controller.registrarAdministracao(
      {
        user: { id: 1, tipo_usuario: "responsavel" },
        params: { id: "1", medicamentoId: "1", horarioId: "1" },
        body: { data: hoje },
      },
      res,
    );
    assert.equal(res.statusCode, 201);
  } finally {
    db.query = consultaOriginal;
    db.criarConexaoTransacional = conexaoOriginal;
  }
});

test("cadastro rejeita horário inválido antes de acessar o banco", async () => {
  const res = resposta();
  await controller.cadastrarMedicamento(
    {
      user: { id: 1, tipo_usuario: "responsavel" },
      params: { id: "1" },
      body: { nome: "Teste", quantidade_comprimidos: 10, horarios: ["25:00"] },
    },
    res,
  );
  assert.equal(res.statusCode, 400);
});

test("lista pacientes mesmo quando a tabela de medicamentos não existe", () => {
  const consultaOriginal = db.query;
  db.query = (sql, _parametros, callback) => {
    if (sql.includes("FROM responsavel_paciente")) {
      callback(null, [{ id: 7, nome: "Paciente de teste" }]);
      return;
    }

    const erro = new Error("Tabela medicamento não encontrada");
    erro.code = "ER_NO_SUCH_TABLE";
    callback(erro);
  };

  try {
    const res = resposta();
    controller.getPacientes(
      { user: { id: 2, tipo_usuario: "responsavel" } },
      res,
    );

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, [
      { id: 7, nome: "Paciente de teste", estoque_baixo: 0 },
    ]);
  } finally {
    db.query = consultaOriginal;
  }
});

test("cuidador não pode criar tarefas manuais", async () => {
  const res = resposta();
  await controller.cadastrarTarefa(
    {
      user: { id: 2, tipo_usuario: "cuidador" },
      params: { id: "1" },
      body: { titulo: "Caminhada", tipo: "diaria" },
    },
    res,
  );
  assert.equal(res.statusCode, 403);
});

test("tarefa semanal exige um dia ISO válido", async () => {
  const res = resposta();
  await controller.cadastrarTarefa(
    {
      user: { id: 1, tipo_usuario: "responsavel" },
      params: { id: "1" },
      body: { titulo: "Caminhada", tipo: "semanal", dia_semana: 8 },
    },
    res,
  );
  assert.equal(res.statusCode, 400);
});

test("conclusão de tarefa rejeita datas diferentes de hoje", async () => {
  const res = resposta();
  await controller.atualizarConclusaoTarefa(
    {
      user: { id: 2, tipo_usuario: "cuidador" },
      params: { id: "1", tarefaId: "1" },
      body: { data: "2020-01-01", concluida: true },
    },
    res,
  );
  assert.equal(res.statusCode, 400);
});

test("cuidador vinculado pode registrar uma anotação no diário", async () => {
  const consultaOriginal = db.query;
  db.query = (sql, _parametros, callback) => {
    if (sql.includes("SELECT 1")) {
      callback(null, [{ acesso: 1 }]);
      return;
    }
    callback(null, { insertId: 9 });
  };

  try {
    const res = resposta();
    await controller.cadastrarDiario(
      {
        user: { id: 2, tipo_usuario: "cuidador" },
        params: { id: "1" },
        body: {
          titulo: "Boa caminhada",
          descricao: "Participou da atividade.",
        },
      },
      res,
    );

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.id, 9);
  } finally {
    db.query = consultaOriginal;
  }
});

test("responsável vinculado pode registrar uma anotação no diário", async () => {
  const consultaOriginal = db.query;
  let parametrosInsercao;
  db.query = (sql, parametros, callback) => {
    if (sql.includes("SELECT 1")) {
      callback(null, [{ acesso: 1 }]);
      return;
    }
    parametrosInsercao = parametros;
    callback(null, { insertId: 10 });
  };

  try {
    const res = resposta();
    await controller.cadastrarDiario(
      {
        user: { id: 1, tipo_usuario: "responsavel" },
        params: { id: "1" },
        body: { titulo: "Consulta médica", descricao: "Retorno agendado." },
      },
      res,
    );

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.id, 10);
    assert.equal(parametrosInsercao[3], 1);
  } finally {
    db.query = consultaOriginal;
  }
});

test("diário exige um título", async () => {
  const res = resposta();
  await controller.cadastrarDiario(
    {
      user: { id: 1, tipo_usuario: "responsavel" },
      params: { id: "1" },
      body: { titulo: "  " },
    },
    res,
  );
  assert.equal(res.statusCode, 400);
});
