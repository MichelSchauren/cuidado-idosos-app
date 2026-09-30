import {
  ArrowLeft,
  BookOpenText,
  CalendarDays,
  CheckSquare,
  ContactRound,
  HeartPulse,
  Pill,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import startSection from "../services/startSection";

const abas = [
  { id: "perfil", nome: "Perfil", Icone: ContactRound },
  { id: "medicamentos", nome: "Medicamentos", Icone: Pill },
  { id: "tarefas", nome: "Tarefas", Icone: CheckSquare },
  { id: "diario", nome: "Diário", Icone: BookOpenText },
  { id: "consultas", nome: "Consultas", Icone: CalendarDays },
];

const statusClasses = {
  Estável: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Atenção: "border-amber-200 bg-amber-50 text-amber-800",
  Crítico: "border-rose-200 bg-rose-50 text-rose-800",
};

function formatarData(data) {
  if (!data) return "Não informado";
  const dataFormatada =
    data instanceof Date
      ? data
      : new Date(`${String(data).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(dataFormatada.getTime())) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR").format(dataFormatada);
}

function CampoLeitura({ rotulo, valor, className = "" }) {
  return (
    <div
      className={`border-b border-slate-100 py-4 last:border-b-0 ${className}`}
    >
      <dt className="text-xs font-semibold uppercase text-slate-500">
        {rotulo}
      </dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm font-medium text-slate-800">
        {valor || "Não informado"}
      </dd>
    </div>
  );
}

function Paciente() {
  const { id, aba } = useParams();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativa = true;

    async function carregarPaciente() {
      const sessaoValida = await startSection(navigate);
      if (!sessaoValida || !ativa) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SERVER}pacientes/${encodeURIComponent(id)}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        const dados = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            dados.error || "Não foi possível carregar o paciente.",
          );
        }

        if (ativa) setPaciente(dados);
      } catch (error) {
        if (ativa) setErro(error.message || "Erro ao carregar o paciente.");
      } finally {
        if (ativa) setCarregando(false);
      }
    }

    carregarPaciente();
    return () => {
      ativa = false;
    };
  }, [id, navigate]);

  if (!aba) return <Navigate to={`/paciente/${id}/perfil`} replace />;
  if (!abas.some((item) => item.id === aba)) {
    return <Navigate to={`/paciente/${id}/perfil`} replace />;
  }

  const avatar = paciente?.foto
    ? `${import.meta.env.VITE_SERVER.replace(/\/api\/?$/, "")}${paciente.foto}`
    : "";
  const classeStatus =
    statusClasses[paciente?.status_atencao] ||
    "border-slate-200 bg-slate-100 text-slate-700";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#d1fae5,_transparent_30%),linear-gradient(135deg,_#f8fafc_0%,_#f0fdfa_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6">
          <Link
            to="/dashboard"
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-700"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar para pacientes
          </Link>

          {carregando ? (
            <div className="h-20 animate-pulse rounded-lg bg-white/70" />
          ) : erro ? (
            <div
              role="alert"
              className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
            >
              {erro}
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {avatar ? (
                <img
                  src={avatar}
                  alt={`Foto de ${paciente.nome}`}
                  className="h-20 w-20 rounded-2xl object-cover ring-4 ring-white"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 ring-4 ring-white">
                  <UserRound className="h-9 w-9" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold uppercase text-emerald-700">
                  Perfil do paciente
                </p>
                <h1 className="mt-1 break-words text-3xl font-semibold text-slate-900">
                  {paciente.nome}
                </h1>
              </div>
              <span
                className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${classeStatus}`}
              >
                <HeartPulse className="h-4 w-4" />
                {paciente.status_atencao || "Status não informado"}
              </span>
            </div>
          )}
        </header>

        <nav
          aria-label="Seções do paciente"
          role="tablist"
          className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200"
        >
          {abas.map(({ id: idAba, nome, Icone }) => (
            <Link
              key={idAba}
              to={`/paciente/${id}/${idAba}`}
              role="tab"
              aria-selected={aba === idAba}
              className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition sm:px-4 ${
                aba === idAba
                  ? "border-emerald-700 text-emerald-800"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
              }`}
            >
              <Icone className="h-4 w-4" /> {nome}
            </Link>
          ))}
        </nav>

        {carregando ? (
          <section
            aria-label="Carregando perfil"
            className="h-72 animate-pulse rounded-lg bg-white/70"
          />
        ) : erro ? null : aba === "perfil" ? (
          <section
            role="tabpanel"
            aria-label="Perfil do paciente"
            className="rounded-lg border border-slate-200 bg-white px-5 shadow-sm sm:px-8"
          >
            <div className="border-b border-slate-100 py-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Dados do paciente
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Informações pessoais e orientações para o cuidado.
              </p>
            </div>
            <dl className="grid gap-x-10 sm:grid-cols-2">
              <CampoLeitura rotulo="Nome" valor={paciente.nome} />
              <CampoLeitura rotulo="CPF" valor={paciente.cpf} />
              <CampoLeitura
                rotulo="Nascimento"
                valor={formatarData(paciente.data_nascimento)}
              />
              <CampoLeitura rotulo="Telefone" valor={paciente.telefone} />
              <CampoLeitura
                rotulo="Endereço"
                valor={paciente.endereco}
                className="sm:col-span-2"
              />
              <CampoLeitura
                rotulo="Status de atenção"
                valor={paciente.status_atencao}
              />
              <CampoLeitura
                rotulo="Observações"
                valor={paciente.observacoes}
                className="sm:col-span-2"
              />
            </dl>
          </section>
        ) : (
          <section
            role="tabpanel"
            className="border-t border-slate-200 py-10 text-center"
          >
            <p className="text-sm font-semibold text-slate-800">
              {abas.find((item) => item.id === aba)?.nome}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Esta seção ainda não está disponível.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

export default Paciente;
