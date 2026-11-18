const test = require("node:test");
const assert = require("node:assert/strict");

const controller = require("../controllers/usuarioController");
const db = require("../config/db");

test.after(
  () =>
    new Promise((resolve, reject) => {
      db.end((error) => (error ? reject(error) : resolve()));
    }),
);

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

function conexaoFalsa(consultar) {
  const chamadas = [];
  let rollback = false;
  let commit = false;

  return {
    chamadas,
    get rollbackExecutado() {
      return rollback;
    },
    get commitExecutado() {
      return commit;
    },
    beginTransaction(callback) {
      callback(null);
    },
    query(sql, parametros, callback) {
      chamadas.push({ sql, parametros });
      callback(null, consultar(sql, parametros));
    },
    commit(callback) {
      commit = true;
      callback(null);
    },
    rollback(callback) {
      rollback = true;
      callback(null);
    },
    release() {},
  };
}

test("lista responsáveis, cuidadores e permissão do paciente", async () => {
  const consultaOriginal = db.query;
  db.query = (sql, _parametros, callback) => {
    if (sql.includes("JOIN responsavel perfil")) {
      callback(null, [{ acesso: 1 }]);
    } else if (sql.includes("SELECT rp.pode_editar_paciente")) {
      callback(null, [
        { pode_editar_paciente: 1, pode_convidar_cuidador: 1 },
      ]);
    } else if (sql.includes("FROM responsavel_paciente x")) {
      callback(null, [{ id: 11, nome: "Maria", idade: 41, genero: "Feminino" }]);
    } else {
      callback(null, [{ id: 12, nome: "João", idade: 36, genero: "Masculino" }]);
    }
  };

  try {
    const res = resposta();
    await controller.getVinculosPaciente(
      {
        user: { id: 5, tipo_usuario: "responsavel" },
        params: { id: "42" },
      },
      res,
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.podeGerenciar, true);
    assert.equal(res.body.podeVincularCuidador, true);
    assert.equal(res.body.responsaveis[0].tipo, "responsavel");
    assert.equal(res.body.cuidadores[0].tipo, "cuidador");
  } finally {
    db.query = consultaOriginal;
  }
});

test("pesquisa rejeita nomes curtos antes de consultar perfis", async () => {
  const consultaOriginal = db.query;
  let consultas = 0;
  db.query = (_sql, _parametros, callback) => {
    consultas += 1;
    callback(null, []);
  };

  try {
    const res = resposta();
    await controller.getPerfisDisponiveis(
      {
        user: { id: 5, tipo_usuario: "responsavel" },
        params: { id: "42" },
        query: { nome: "a" },
      },
      res,
    );

    assert.equal(res.statusCode, 400);
    assert.equal(consultas, 0);
  } finally {
    db.query = consultaOriginal;
  }
});

test("não pesquisa cuidadores sem permissão para vinculá-los", async () => {
  const consultaOriginal = db.query;
  let consultasPerfis = 0;
  db.query = (sql, _parametros, callback) => {
    if (sql.includes("JOIN responsavel perfil")) {
      callback(null, [{ acesso: 1 }]);
      return;
    }
    if (sql.includes("SELECT rp.pode_editar_paciente")) {
      callback(null, [
        { pode_editar_paciente: 1, pode_convidar_cuidador: 0 },
      ]);
      return;
    }

    consultasPerfis += 1;
    callback(null, []);
  };

  try {
    const res = resposta();
    await controller.getPerfisDisponiveis(
      {
        user: { id: 5, tipo_usuario: "responsavel" },
        params: { id: "42" },
        query: { nome: "jo", tipo: "cuidador" },
      },
      res,
    );

    assert.equal(res.statusCode, 403);
    assert.equal(consultasPerfis, 0);
  } finally {
    db.query = consultaOriginal;
  }
});

test("pesquisa aplica filtros e retorna somente perfis ainda não vinculados", async () => {
  const consultaOriginal = db.query;
  const consultasPerfis = [];
  db.query = (sql, parametros, callback) => {
    if (sql.includes("JOIN responsavel perfil")) {
      callback(null, [{ acesso: 1 }]);
      return;
    }
    if (sql.includes("SELECT rp.pode_editar_paciente")) {
      callback(null, [
        { pode_editar_paciente: 1, pode_convidar_cuidador: 1 },
      ]);
      return;
    }

    consultasPerfis.push({ sql, parametros });
    callback(null, [
      { id: 20, nome: "Ana Martins", idade: 34, genero: "Feminino" },
    ]);
  };

  try {
    const res = resposta();
    await controller.getPerfisDisponiveis(
      {
        user: { id: 5, tipo_usuario: "responsavel" },
        params: { id: "42" },
        query: {
          nome: "an",
          idadeMinima: "20",
          idadeMaxima: "40",
          genero: "Feminino",
          tipo: "todos",
        },
      },
      res,
    );

    assert.equal(res.statusCode, 200);
    assert.deepEqual(
      res.body.map(({ tipo }) => tipo),
      ["responsavel", "cuidador"],
    );
    assert.equal(consultasPerfis.length, 2);
    for (const consulta of consultasPerfis) {
      assert.match(consulta.sql, /NOT EXISTS/);
      assert.deepEqual(consulta.parametros, ["%an%", "42", 20, 40, "F"]);
    }
  } finally {
    db.query = consultaOriginal;
  }
});

test("vincula perfil ativo em transação para responsável autorizado", async () => {
  const conexaoOriginal = db.criarConexaoTransacional;
  const conexao = conexaoFalsa((sql) => {
    if (sql.includes("pode_editar_paciente")) {
      return [{ pode_editar_paciente: 1, pode_convidar_cuidador: 1 }];
    }
    if (sql.includes("FROM cuidador perfil")) return [{ id: 8 }];
    if (sql.includes("FROM cuidador_paciente")) return [];
    if (sql.startsWith("INSERT INTO cuidador_paciente")) {
      return { insertId: 31 };
    }
    throw new Error(`Consulta inesperada: ${sql}`);
  });
  db.criarConexaoTransacional = async () => conexao;

  try {
    const res = resposta();
    await controller.vincularPerfilPaciente(
      {
        user: { id: 5, tipo_usuario: "responsavel" },
        params: { id: "42" },
        body: { tipo: "cuidador", perfilId: "8" },
      },
      res,
    );

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.perfilId, "8");
    assert.equal(conexao.commitExecutado, true);
    assert.deepEqual(
      conexao.chamadas.at(-1).parametros,
      ["8", "42"],
    );
  } finally {
    db.criarConexaoTransacional = conexaoOriginal;
  }
});

test("bloqueia vínculo de cuidador sem permissão específica", async () => {
  const conexaoOriginal = db.criarConexaoTransacional;
  const conexao = conexaoFalsa((sql) => {
    if (sql.includes("pode_editar_paciente")) {
      return [{ pode_editar_paciente: 1, pode_convidar_cuidador: 0 }];
    }
    throw new Error(`Consulta inesperada: ${sql}`);
  });
  db.criarConexaoTransacional = async () => conexao;

  try {
    const res = resposta();
    await controller.vincularPerfilPaciente(
      {
        user: { id: 5, tipo_usuario: "responsavel" },
        params: { id: "42" },
        body: { tipo: "cuidador", perfilId: "8" },
      },
      res,
    );

    assert.equal(res.statusCode, 403);
    assert.equal(conexao.commitExecutado, false);
    assert.equal(conexao.rollbackExecutado, true);
    assert.equal(conexao.chamadas.length, 1);
  } finally {
    db.criarConexaoTransacional = conexaoOriginal;
  }
});

test("impede remover o último responsável vinculado", async () => {
  const conexaoOriginal = db.criarConexaoTransacional;
  const conexao = conexaoFalsa((sql) => {
    if (sql.includes("pode_editar_paciente")) {
      return [{ pode_editar_paciente: 1 }];
    }
    if (sql.includes("FROM responsavel_paciente x")) {
      return [{ usuario_id: 9 }];
    }
    if (sql.includes("FROM responsavel_paciente") && sql.includes("<>")) {
      return [];
    }
    throw new Error(`Consulta inesperada: ${sql}`);
  });
  db.criarConexaoTransacional = async () => conexao;

  try {
    const res = resposta();
    await controller.desvincularPerfilPaciente(
      {
        user: { id: 5, tipo_usuario: "responsavel" },
        params: { id: "42", tipo: "responsavel", perfilId: "8" },
      },
      res,
    );

    assert.equal(res.statusCode, 409);
    assert.equal(conexao.commitExecutado, false);
    assert.equal(conexao.rollbackExecutado, true);
    assert.equal(
      conexao.chamadas.some((chamada) => chamada.sql.startsWith("DELETE")),
      false,
    );
  } finally {
    db.criarConexaoTransacional = conexaoOriginal;
  }
});
