import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");

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
        body: JSON.stringify({ login: usuario, senha }),
      });

      // Se o backend responder com 200 OK, o login é válido.
      if (response.ok) {
        const data = await response.json();
        console.log(data);
        localStorage.setItem("token", data.token);

        navigate("/dashboard");
        return;
      }

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Acesso
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Entrar na plataforma
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Acesse sua conta para continuar.
          </p>
        </div>

        <form onSubmit={validarLogin} className="space-y-4">
          <div>
            <label
              htmlFor="usuario"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Usuário
            </label>
            <input
              type="text"
              name="usuario"
              id="usuario"
              value={usuario}
              required
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="Digite seu usuário"
            />
          </div>

          <div>
            <label
              htmlFor="senha"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Senha
            </label>
            <input
              type="password"
              name="senha"
              id="senha"
              value={senha}
              required
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="Digite sua senha"
            />
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
    </div>
  );
}

export default LoginPage;
