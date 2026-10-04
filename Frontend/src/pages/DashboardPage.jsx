import { useState } from "react";
import { Link } from "react-router-dom";
import ListaPacientes from "../components/ListaPacientes";
import { useEffect } from "react";
import { Plus, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

import startSection from "../services/startSection";
import {
  CabecalhoMarca,
  CreditoLaboratorio,
} from "../components/IdentidadeVisual";

function DashboardPage() {
  const [pacientes, setPacientes] = useState([]);
  const [perfil, setPerfil] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function carregarDados() {
      // Validar sessão
      const sessaoValida = await startSection(navigate);
      if (!sessaoValida) return;

      const token = localStorage.getItem("token");

      try {
        // Carregar perfil do usuário
        const perfilResponse = await fetch(
          import.meta.env.VITE_SERVER + "perfil",
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (perfilResponse.ok) {
          setPerfil(await perfilResponse.json());
        }

        // Pegar lista de pacientes
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

    carregarDados();
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <CabecalhoMarca to="/dashboard">
        <div className="flex items-center gap-3">
          <Link
            to="/perfil"
            className="group flex items-center gap-2 rounded-xl px-2 py-1 transition hover:bg-emerald-50"
            aria-label="Seus dados"
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
            {(perfil?.nome || perfil?.login) && (
              <span className="hidden max-w-40 truncate text-sm font-semibold text-white sm:block">
                {perfil.nome || perfil.login}
              </span>
            )}
          </Link>

          {perfil?.tipo_usuario === "responsavel" && (
            <Link
              to="/add-paciente"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              <Plus className="h-4 w-4" /> Novo paciente
            </Link>
          )}
        </div>
      </CabecalhoMarca>
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Pacientes
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {pacientes?.length || 0} pacientes cadastrados
            </p>
          </div>
        </div>
        <ListaPacientes pacientes={pacientes} />
      </main>
      <CreditoLaboratorio />
    </div>
  );
}

export default DashboardPage;
