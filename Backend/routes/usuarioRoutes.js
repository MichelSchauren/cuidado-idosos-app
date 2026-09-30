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
router.put("/perfil", verificarToken, usuarioController.atualizarPerfil);
router.post(
  "/pacientes",
  verificarToken,
  uploadFotoPaciente.single("foto"),
  usuarioController.cadastrarPaciente,
);
router.get("/pacientes/:id", verificarToken, usuarioController.getPaciente);
router.get("/get-pacientes", verificarToken, usuarioController.getPacientes);
router.put("/alterar-senha", verificarToken, usuarioController.alterarSenha);

module.exports = router;
