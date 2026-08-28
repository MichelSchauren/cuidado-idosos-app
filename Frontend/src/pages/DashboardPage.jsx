import { useState } from "react";
import { Link } from "react-router-dom";
import ListaPacientes from "../components/ListaPacientes";
import { useEffect } from "react";
import { Plus, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

import startSection from "../services/startSection";

function DashboardPage() {
  const [pacientes, setPacientes] = useState([]);
  const [perfil, setPerfil] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function carregarPacientes() {
      const sessaoValida = await startSection(navigate);
      if (!sessaoValida) return;

      const token = localStorage.getItem("token");

      try {
        const perfilResponse = await fetch(
          import.meta.env.VITE_SERVER + "perfil",
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (perfilResponse.ok) {
          setPerfil(await perfilResponse.json());
        }

        const response = await fetch(
          import.meta.env.VITE_SERVER + "get-pacientes",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Não foi possível carregar os pacientes.",
          );
        }

        setPacientes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setPacientes([]);
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

          <div className="flex flex-col items-center gap-3">
            <Link
              to="/perfil"
              className="group flex flex-col items-center gap-1.5 rounded-xl px-2 py-1 transition hover:bg-slate-50"
              aria-label="Editar perfil"
            >
              {perfil?.foto_perfil ? (
                <img
                  src={`${import.meta.env.VITE_SERVER.replace(/\/api\/?$/, "")}${perfil.foto_perfil}`}
                  alt="Foto do perfil"
                  className="h-11 w-11 rounded-full object-cover ring-2 ring-emerald-100 transition group-hover:ring-emerald-300"
                />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 ring-2 ring-emerald-100 transition group-hover:ring-emerald-300">
                  <User className="h-5 w-5" />
                </span>
              )}
              <span className="max-w-32 truncate text-xs font-semibold text-slate-700">
                {perfil?.nome || perfil?.login || "Meu perfil"}
              </span>
            </Link>

            <Link
              to="#"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
            >
              <Plus className="h-3.5 w-3.5" /> Novo paciente
            </Link>
          </div>
        </div>
      </header>

      {/* Lista de pacientes */}
      <ListaPacientes pacientes={pacientes} />
    </div>
  );
}

export default DashboardPage;
