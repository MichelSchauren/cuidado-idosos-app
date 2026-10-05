import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BotaoVisual from "../components/BotaoVisual";
import {
  CabecalhoMarca,
  CreditoLaboratorio,
} from "../components/IdentidadeVisual";

function LoginPage() {
  const navigate = useNavigate();
  const [identificador, setIdentificador] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  async function validarLogin(event) {
    event.preventDefault();

    // Validações HTML nativas do formulário.
    const formulario = document.querySelector("form");
    if (formulario.checkValidity() === false) {
      formulario.reportValidity();
      return;
    }

    try {
      // Envia login e senha ao backend para autenticar.
      const response = await fetch(import.meta.env.VITE_SERVER + "login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ login: identificador, senha }),
      });

      // Se o backend responder com 200 OK, o login é válido.
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.token);

        navigate("/dashboard");
        return;
      }

      if (response.status === 500)
        return alert("Não foi possível se comunicar com o servidor.");

      // Se não for 200, mostra a mensagem de erro retornada pelo backend.
      const errorData = await response.json();
      alert(errorData.error || "Usuário ou senha inválidos.");
      setSenha("");
    } catch (err) {
      console.error(err);
      alert("Erro de conexão com o servidor. Tente novamente.");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_80%_15%,_#d1fae5,_transparent_28%),linear-gradient(135deg,_#f8fafc_0%,_#ecfdf5_100%)]">
      <CabecalhoMarca />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-white bg-white/95 p-8 shadow-2xl shadow-emerald-950/10">
          <div className="mb-6 text-center">
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">
              Boas-vindas ao Cuidaê
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Acesse sua conta para continuar.
            </p>
          </div>

          <form onSubmit={validarLogin} className="space-y-4">
            <div>
              <label
                htmlFor="identificador"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Usuário ou e-mail
              </label>
              <input
                type="text"
                name="identificador"
                id="identificador"
                autoComplete="username"
                value={identificador}
                required
                onChange={(e) => setIdentificador(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="Digite seu usuário ou e-mail"
              />
            </div>

            <div>
              <label
                htmlFor="senha"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  name="senha"
                  id="senha"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 pr-12 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="Digite sua senha"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-lg"
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  <BotaoVisual ver={mostrarSenha} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Entrar
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-600">
            Ainda não tem conta?{" "}
            <Link
              to="/cadastro"
              className="font-semibold text-emerald-700 hover:underline"
            >
              Cadastre-se aqui
            </Link>
          </p>
        </div>
      </main>
      <CreditoLaboratorio />
    </div>
  );
}

export default LoginPage;
