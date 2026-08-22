import { useState } from "react";
import { Link } from "react-router-dom";
import ListaPacientes from "../components/ListaPacientes";
import { useEffect } from "react";
import { Plus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import startSection from "../services/startSection";

function DashboardPage() {
  const [pacientes, setPacientes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    startSection(navigate);

    async function carregarPacientes() {
      try {
        const response = await fetch(import.meta.env.VITE_SERVER + "paciente");
        const data = await response.json();
        setPacientes(data);
      } catch (err) {
        console.log(err);
        alert("Erro de conexão com o servidor. Tente novamente.");
      }
    }

    carregarPacientes();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-5 shadow-sm sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
              Dashboard
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">
              Lista de pacientes
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {pacientes && pacientes.length > 0 ? pacientes.length : "0"}{" "}
              pacientes cadastrados
            </p>
          </div>

          <Link
            to="#"
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" /> Novo paciente
          </Link>
        </div>
      </header>

      {/* Lista de pacientes */}
      <ListaPacientes pacientes={pacientes} />
    </div>
  );
}

export default DashboardPage;
