const fs = require("fs");
const path = require("path");
const multer = require("multer");

const diretorioFotos = path.join(__dirname, "..", "imagens", "foto_pacientes");

fs.mkdirSync(diretorioFotos, { recursive: true });

const armazenamento = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, diretorioFotos),
  filename: (_req, file, callback) => {
    const extensao = path.extname(file.originalname).toLowerCase();
    callback(
      null,
      `${Date.now()}-${Math.round(Math.random() * 1e9)}${extensao}`,
    );
  },
});

module.exports = multer({
  storage: armazenamento,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      return callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "foto"));
    }

    return callback(null, true);
  },
});
