import { Link } from "react-router-dom";
import { CreditoLaboratorio, MarcaCuidae } from "./components/IdentidadeVisual";
import logoCuidae from "./assets/logo.png";

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_80%_20%,_#d1fae5,_transparent_30%),linear-gradient(135deg,_#f8fafc_0%,_#ecfdf5_100%)]">
      <header className="border-b border-emerald-100/80 bg-emerald-900 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <MarcaCuidae />
        </div>
      </header>
      <main className="flex flex-1 items-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 overflow-hidden rounded-[2rem] border border-white bg-white/85 p-7 shadow-2xl shadow-emerald-950/10 backdrop-blur sm:p-12 lg:grid-cols-[1.2fr_0.8fr] lg:p-16">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
              Cuidado próximo, todos os dias
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Mais tranquilidade para cuidar de quem você ama.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Organize pacientes, medicamentos, consultas e rotinas de cuidado
              em um só lugar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-800"
              >
                Acessar minha conta
              </Link>
              <Link
                to="/cadastro"
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50"
              >
                Criar conta
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-center rounded-3xl bg-emerald-50/80 p-7 sm:p-10">
            <img
              src={logoCuidae}
              alt="Logo Cuidaê: cuidado e acolhimento"
              className="w-full max-w-xs drop-shadow-sm"
            />
          </div>
        </div>
      </main>
      <CreditoLaboratorio />
    </div>
  );
}

export default App;
