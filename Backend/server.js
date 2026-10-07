require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const routes = require("./routes/usuarioRoutes");

const app = express();

// CORS funcionando em localhost e em cuidado-idosos-app.vercel.app
app.use(
  cors({
    origin: ["http://localhost:5173", "http://cuidado-idosos-app.vercel.app"],
  }),
);

app.use(express.json()); // Permite que o backend receba dados JSON no corpo das requisições POST/PUT.
app.use("/imagens", express.static(path.join(__dirname, "imagens")));
app.use("/api", routes);

// Teste de rota
app.get("/", (req, res) => {
  res.send("Servidor rodando!");
});

// Rodar servidor
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
