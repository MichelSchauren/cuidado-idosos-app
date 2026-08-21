import { Link } from "react-router-dom";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-100 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 rounded-[32px] border border-emerald-100 bg-white/80 p-8 shadow-xl backdrop-blur sm:p-10 lg:flex-row lg:items-center lg:justify-between lg:p-14">
        <div className="max-w-xl">
          <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
            Cuidado para idosos
          </span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Organize o cuidado com mais tranquilidade.
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Uma plataforma simples para acompanhar pacientes, facilitar o acesso
            e manter tudo em ordem.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Fazer login
            </Link>
            <Link
              to="/cadastro"
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
