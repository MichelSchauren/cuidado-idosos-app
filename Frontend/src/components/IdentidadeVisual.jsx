import { Link } from "react-router-dom";
import logoCuidae from "../assets/logo.png";
import logoLaboratorio from "../assets/logo_lab_ideias.png";
import logoIFRS from "../assets/ifrs-logo.svg";

export function MarcaCuidae({ to = "/" }) {
  return (
    <Link
      to={to}
      aria-label="Cuidaê — página inicial"
      className="inline-flex w-fit items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
    >
      <img
        src={logoCuidae}
        alt=""
        className="h-12 w-12 object-contain sm:h-14 sm:w-14"
      />
      <span className="text-2xl font-bold tracking-tight text-teal-600 sm:text-3xl">
        Cuidaê
      </span>

      <img
        src={logoIFRS}
        alt=""
        className="h-12 w-12 object-contain sm:h-14 sm:w-14"
      />
    </Link>
  );
}

export function CabecalhoMarca({ to, children }) {
  return (
    <header className="border-b border-emerald-100/80 bg-emerald-900 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <MarcaCuidae to={to} />
        {children}
      </div>
    </header>
  );
}

export function CreditoLaboratorio() {
  return (
    <footer className="mx-auto flex w-full max-w-6xl items-center justify-center gap-3 px-4 py-5 text-xs text-slate-500 sm:px-6 lg:px-8">
      <span>
        <strong>© Cuidaê 2026 |</strong>
      </span>
      <img
        src={logoLaboratorio}
        alt="Laboratório de Ideias"
        className="h-16 w-16 object-contain"
      />
    </footer>
  );
}
