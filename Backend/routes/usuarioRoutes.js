const router = require("express").Router();
const usuarioController = require("../controllers/usuarioController");
const verificarToken = require("../middlewares/verificarToken");

router.post("/login", usuarioController.login);
router.post("/cadastro", usuarioController.cadastrar);

router.get("/validar-token", verificarToken, (req, res) => {
	res.status(200).json({ message: "Acesso autorizado.", user: req.user });
});

router.get("/get-pacientes", verificarToken, usuarioController.getPacientes);

module.exports = router;
