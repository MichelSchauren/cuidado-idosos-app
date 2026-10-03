const router = require("express").Router();
const usuarioController = require("../controllers/usuarioController");
const verificarToken = require("../middlewares/verificarToken");
const uploadFotoPerfil = require("../middlewares/uploadFotoPerfil");
const uploadFotoPaciente = require("../middlewares/uploadFotoPaciente");

router.post("/login", usuarioController.login);
router.post(
  "/cadastro",
  uploadFotoPerfil.single("foto_perfil"),
  usuarioController.cadastrar,
);

router.get("/validar-token", verificarToken, (req, res) => {
  res.status(200).json({ message: "Acesso autorizado.", user: req.user });
});

router.get("/perfil", verificarToken, usuarioController.getPerfil);
router.put(
  "/perfil",
  verificarToken,
  uploadFotoPerfil.single("foto_perfil"),
  usuarioController.atualizarPerfil,
);
router.post(
  "/pacientes",
  verificarToken,
  uploadFotoPaciente.single("foto"),
  usuarioController.cadastrarPaciente,
);
router.put(
  "/pacientes/:id",
  verificarToken,
  uploadFotoPaciente.single("foto"),
  usuarioController.atualizarPaciente,
);
router.delete(
  "/pacientes/:id",
  verificarToken,
  usuarioController.excluirPaciente,
);
router.get("/pacientes/:id", verificarToken, usuarioController.getPaciente);
router.get("/get-pacientes", verificarToken, usuarioController.getPacientes);
router.get(
  "/pacientes/:id/medicamentos",
  verificarToken,
  usuarioController.getMedicamentos,
);
router.get(
  "/pacientes/:id/tarefas",
  verificarToken,
  usuarioController.getTarefas,
);
router.post(
  "/pacientes/:id/tarefas",
  verificarToken,
  usuarioController.cadastrarTarefa,
);
router.patch(
  "/pacientes/:id/tarefas/:tarefaId",
  verificarToken,
  usuarioController.atualizarConclusaoTarefa,
);
router.post(
  "/pacientes/:id/medicamentos",
  verificarToken,
  usuarioController.cadastrarMedicamento,
);
router.delete(
  "/pacientes/:id/medicamentos/:medicamentoId",
  verificarToken,
  usuarioController.removerMedicamento,
);
router.patch(
  "/pacientes/:id/medicamentos/:medicamentoId/estoque",
  verificarToken,
  usuarioController.adicionarEstoque,
);
router.post(
  "/pacientes/:id/medicamentos/:medicamentoId/horarios/:horarioId/administracoes",
  verificarToken,
  usuarioController.registrarAdministracao,
);
router.put("/alterar-senha", verificarToken, usuarioController.alterarSenha);

module.exports = router;
