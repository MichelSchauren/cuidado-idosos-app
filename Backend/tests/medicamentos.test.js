const test = require("node:test");
const assert = require("node:assert/strict");

const controller = require("../controllers/usuarioController");

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

test("responsável não registra dose no lugar do cuidador", async () => {
  const res = resposta();
  await controller.registrarAdministracao(
    {
      user: { id: 1, tipo_usuario: "responsavel" },
      params: { id: "1", medicamentoId: "1", horarioId: "1" },
      body: { data: "2026-09-30" },
    },
    res,
  );
  assert.equal(res.statusCode, 403);
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
