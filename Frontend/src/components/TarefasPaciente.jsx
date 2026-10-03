import {
  Check,
  CheckCircle2,
  ClipboardList,
  Clock3,
  LoaderCircle,
  Plus,
  Repeat2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function dataLocalAtual() {
  const data = new Date();
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

function TarefasPaciente({ pacienteId, tipoUsuario }) {
  const hoje = dataLocalAtual();
  const baseUrl = `${import.meta.env.VITE_SERVER}pacientes/${encodeURIComponent(pacienteId)}/tarefas`;
  const [tarefas, setTarefas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState("diaria");
  const [diaSemana, setDiaSemana] = useState("1");
  const [dataEspecifica, setDataEspecifica] = useState(hoje);
  const responsavel = tipoUsuario === "responsavel";
  const cuidador = tipoUsuario === "cuidador";
  const podeRegistrarDose = responsavel || cuidador;

  const carregarTarefas = useCallback(async () => {
    setErro("");
    try {
      const response = await fetch(`${baseUrl}?data=${hoje}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const dados = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(dados.error || "Não foi possível carregar as tarefas.");
      }
      setTarefas(Array.isArray(dados) ? dados : []);
    } catch (error) {
      setErro(error.message || "Erro ao carregar as tarefas.");
    } finally {
      setCarregando(false);
    }
  }, [baseUrl, hoje]);

  useEffect(() => {
    carregarTarefas();
  }, [carregarTarefas]);

  async function adicionarTarefa(event) {
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
        body: JSON.stringify({
          titulo,
          descricao,
          tipo,
          dia_semana: tipo === "semanal" ? Number(diaSemana) : null,
          data_especifica: tipo === "unica" ? dataEspecifica : null,
        }),
      });
      const dados = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(dados.error || "Não foi possível adicionar a tarefa.");
      }

      setTitulo("");
      setDescricao("");
      setTipo("diaria");
      setMensagem("Tarefa adicionada.");
      await carregarTarefas();
    } catch (error) {
      setErro(error.message || "Erro ao adicionar a tarefa.");
    } finally {
      setSalvando(false);
    }
  }

  async function atualizarConclusao(tarefa, concluida) {
    setErro("");
    setMensagem("");

    try {
      let response;
      if (tarefa.origem === "medicamento") {
        if (!concluida || !podeRegistrarDose) return;
        response = await fetch(
          `${import.meta.env.VITE_SERVER}pacientes/${encodeURIComponent(pacienteId)}/medicamentos/${tarefa.medicamento_id}/horarios/${tarefa.medicamento_horario_id}/administracoes`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ data: hoje }),
          },
        );
      } else {
        response = await fetch(`${baseUrl}/${tarefa.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ data: hoje, concluida }),
        });
      }

      const dados = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(dados.error || "Não foi possível atualizar a tarefa.");
      }

      setMensagem(
        tarefa.origem === "medicamento"
          ? "Dose registrada e tarefa concluída."
          : concluida
            ? "Tarefa concluída."
            : "Tarefa reaberta.",
      );
      await carregarTarefas();
    } catch (error) {
      setErro(error.message || "Erro ao atualizar a tarefa.");
    }
  }

  const diasSemana = [
    ["1", "Segunda-feira"],
    ["2", "Terça-feira"],
    ["3", "Quarta-feira"],
    ["4", "Quinta-feira"],
    ["5", "Sexta-feira"],
    ["6", "Sábado"],
    ["7", "Domingo"],
  ];
  const concluidas = tarefas.filter((tarefa) => tarefa.concluida).length;

  return (
    <section role="tabpanel" aria-label="Tarefas" className="space-y-5">
      <header className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <ClipboardList className="h-5 w-5 text-emerald-700" /> Tarefas de
            hoje
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {new Intl.DateTimeFormat("pt-BR", { dateStyle: "full" }).format(
              new Date(`${hoje}T00:00:00`),
            )}
          </p>
        </div>
        <span className="text-sm text-slate-500">
          {concluidas} de {tarefas.length} concluídas
        </span>
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
          onSubmit={adicionarTarefa}
          className="border-b border-slate-200 pb-6"
        >
          <h3 className="text-sm font-semibold text-slate-800">
            Adicionar tarefa
          </h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Título
              <input
                required
                maxLength={150}
                value={titulo}
                onChange={(event) => setTitulo(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="Ex.: Caminhada no parque"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Frequência
              <select
                value={tipo}
                onChange={(event) => setTipo(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="diaria">Todos os dias</option>
                <option value="semanal">Semanal</option>
                <option value="unica">Uma vez</option>
              </select>
            </label>
            {tipo === "semanal" && (
              <label className="text-sm font-medium text-slate-700">
                Dia da semana
                <select
                  value={diaSemana}
                  onChange={(event) => setDiaSemana(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  {diasSemana.map(([valor, nome]) => (
                    <option key={valor} value={valor}>
                      {nome}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {tipo === "unica" && (
              <label className="text-sm font-medium text-slate-700">
                Data
                <input
                  type="date"
                  required
                  min={hoje}
                  value={dataEspecifica}
                  onChange={(event) => setDataEspecifica(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            )}
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Descrição{" "}
              <span className="font-normal text-slate-400">(opcional)</span>
              <textarea
                rows={2}
                value={descricao}
                onChange={(event) => setDescricao(event.target.value)}
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
            {salvando ? "Salvando..." : "Adicionar tarefa"}
          </button>
        </form>
      )}

      {carregando ? (
        <div className="h-44 animate-pulse rounded-lg bg-slate-100" />
      ) : tarefas.length === 0 ? (
        <div className="py-12 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 font-semibold text-slate-700">
            Nenhuma tarefa para hoje
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Tarefas diárias, semanais e agendadas aparecerão aqui.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {tarefas.map((tarefa) => {
            const tarefaMedicamento = tarefa.origem === "medicamento";
            const desabilitada = tarefaMedicamento && !podeRegistrarDose;
            return (
              <li key={tarefa.id} className="flex items-start gap-3 py-4">
                <input
                  type="checkbox"
                  checked={tarefa.concluida}
                  disabled={
                    desabilitada || (tarefaMedicamento && tarefa.concluida)
                  }
                  onChange={(event) =>
                    atualizarConclusao(tarefa, event.target.checked)
                  }
                  className="mt-1 h-5 w-5 shrink-0 accent-emerald-700 disabled:cursor-not-allowed"
                  aria-label={`Marcar ${tarefa.titulo} como concluída`}
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-sm font-semibold ${tarefa.concluida ? "text-slate-400 line-through" : "text-slate-800"}`}
                  >
                    {tarefa.titulo}
                  </span>
                  {tarefa.descricao && (
                    <span className="mt-1 block whitespace-pre-wrap text-sm text-slate-500">
                      {tarefa.descricao}
                    </span>
                  )}
                  <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Repeat2 className="h-3.5 w-3.5" />
                      {tarefaMedicamento
                        ? "Medicamento"
                        : tarefa.tipo === "diaria"
                          ? "Diária"
                          : tarefa.tipo === "semanal"
                            ? "Semanal"
                            : "Agendada"}
                    </span>
                    {tarefa.horario && (
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {String(tarefa.horario).slice(0, 5)}
                      </span>
                    )}
                    {desabilitada && (
                      <span>
                        Somente o responsável ou cuidador pode registrar a dose.
                      </span>
                    )}
                  </span>
                </span>
                {tarefa.concluida && (
                  <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-700" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default TarefasPaciente;
