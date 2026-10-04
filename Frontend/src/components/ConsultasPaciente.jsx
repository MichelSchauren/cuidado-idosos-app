import {
  CalendarDays,
  Clock3,
  LoaderCircle,
  MapPin,
  Plus,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const formularioInicial = {
  medico: "",
  especialidade: "",
  local: "",
  data_hora: "",
  observacoes: "",
};

function ConsultasPaciente({ pacienteId, tipoUsuario }) {
  const [consultas, setConsultas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [formulario, setFormulario] = useState(formularioInicial);
  const responsavel = tipoUsuario === "responsavel";
  const baseUrl = `${import.meta.env.VITE_SERVER}pacientes/${encodeURIComponent(pacienteId)}/consultas`;

  const carregarConsultas = useCallback(async () => {
    setErro("");
    try {
      const response = await fetch(baseUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const dados = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          dados.error || "Não foi possível carregar as consultas.",
        );
      }
      setConsultas(Array.isArray(dados) ? dados : []);
    } catch (error) {
      setErro(error.message || "Erro ao carregar as consultas.");
    } finally {
      setCarregando(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    carregarConsultas();
  }, [carregarConsultas]);

  function atualizarCampo(event) {
    const { name, value } = event.target;
    setFormulario((atual) => ({ ...atual, [name]: value }));
  }

  async function agendarConsulta(event) {
    event.preventDefault();
    setSalvando(true);
    setErro("");
    setMensagem("");

    try {
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formulario),
      });
      const dados = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(dados.error || "Não foi possível agendar a consulta.");
      }

      setFormulario(formularioInicial);
      setMensagem("Consulta agendada e adicionada às tarefas.");
      await carregarConsultas();
    } catch (error) {
      setErro(error.message || "Erro ao agendar a consulta.");
    } finally {
      setSalvando(false);
    }
  }

  function formatarDataHora(valor) {
    const data = new Date(`${valor}:00`);
    if (Number.isNaN(data.getTime())) return valor;
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(data);
  }

  return (
    <section
      role="tabpanel"
      aria-label="Consultas"
      className="space-y-5 rounded-lg border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-8"
    >
      <header className="border-b border-slate-200 pb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <CalendarDays className="h-5 w-5 text-emerald-700" />
          Consultas médicas
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Acompanhe os agendamentos e seus detalhes.
        </p>
      </header>

      {erro && (
        <p
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          {erro}
        </p>
      )}
      {mensagem && (
        <p
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {mensagem}
        </p>
      )}

      {responsavel && (
        <form
          onSubmit={agendarConsulta}
          className="border-b border-slate-200 pb-6"
        >
          <h3 className="text-sm font-semibold text-slate-800">
            Agendar consulta
          </h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Médico
              <input
                name="medico"
                value={formulario.medico}
                onChange={atualizarCampo}
                maxLength={150}
                required
                placeholder="Ex.: Dr. Ricardo"
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Especialidade
              <input
                name="especialidade"
                value={formulario.especialidade}
                onChange={atualizarCampo}
                maxLength={100}
                required
                placeholder="Ex.: Clínico geral"
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Local
              <input
                name="local"
                value={formulario.local}
                onChange={atualizarCampo}
                maxLength={255}
                required
                placeholder="Ex.: Feliz-RS"
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Data e hora
              <input
                type="datetime-local"
                name="data_hora"
                value={formulario.data_hora}
                onChange={atualizarCampo}
                required
                min={new Date(
                  Date.now() - new Date().getTimezoneOffset() * 60000,
                )
                  .toISOString()
                  .slice(0, 16)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Observações{" "}
              <span className="font-normal text-slate-400">(opcional)</span>
              <textarea
                name="observacoes"
                rows={3}
                value={formulario.observacoes}
                onChange={atualizarCampo}
                className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={salvando}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
          >
            {salvando ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {salvando ? "Agendando..." : "Agendar consulta"}
          </button>
        </form>
      )}

      {carregando ? (
        <div className="h-44 animate-pulse rounded-lg bg-slate-100" />
      ) : consultas.length === 0 ? (
        <div className="py-10 text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 font-semibold text-slate-700">
            Nenhuma consulta agendada
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {consultas.map((consulta) => (
            <li key={consulta.id} className="py-4">
              <h3 className="font-semibold text-slate-900">
                {consulta.especialidade}
              </h3>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2 text-slate-600">
                  <UserRound className="h-4 w-4 shrink-0 text-emerald-700" />
                  <dt className="sr-only">Médico</dt>
                  <dd>{consulta.medico}</dd>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="h-4 w-4 shrink-0 text-emerald-700" />
                  <dt className="sr-only">Local</dt>
                  <dd>{consulta.local}</dd>
                </div>
                <div className="flex items-center gap-2 text-slate-600 sm:col-span-2">
                  <Clock3 className="h-4 w-4 shrink-0 text-emerald-700" />
                  <dt className="sr-only">Data e hora</dt>
                  <dd>{formatarDataHora(consulta.data_hora)}</dd>
                </div>
              </dl>
              {consulta.observacoes && (
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
                  <span className="font-medium text-slate-700">
                    Observações:{" "}
                  </span>
                  {consulta.observacoes}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default ConsultasPaciente;
