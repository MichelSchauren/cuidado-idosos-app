import {
  BookOpenText,
  CalendarDays,
  LoaderCircle,
  Plus,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function formatarData(data) {
  if (!data) return "Data não informada";
  const dataRegistro = new Date(data);
  if (Number.isNaN(dataRegistro.getTime())) return "Data não informada";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(dataRegistro);
}

function DiarioPaciente({ pacienteId }) {
  const baseUrl = `${import.meta.env.VITE_SERVER}pacientes/${encodeURIComponent(pacienteId)}/diario`;
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");

  const carregarRegistros = useCallback(async () => {
    setErro("");
    try {
      const response = await fetch(baseUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const dados = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(dados.error || "Não foi possível carregar o diário.");
      }
      setRegistros(Array.isArray(dados) ? dados : []);
    } catch (error) {
      setErro(error.message || "Erro ao carregar o diário.");
    } finally {
      setCarregando(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    carregarRegistros();
  }, [carregarRegistros]);

  async function adicionarRegistro(event) {
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
        body: JSON.stringify({ titulo, descricao }),
      });
      const dados = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          dados.error || "Não foi possível adicionar o registro.",
        );
      }

      setTitulo("");
      setDescricao("");
      setMensagem("Registro adicionado ao diário.");
      await carregarRegistros();
    } catch (error) {
      setErro(error.message || "Erro ao adicionar ao diário.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section role="tabpanel" aria-label="Diário" className="space-y-6">
      <header className="border-b border-slate-200 pb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <BookOpenText className="h-5 w-5 text-emerald-700" /> Diário
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Anotações sobre acontecimentos e observações do cuidado.
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

      <form
        onSubmit={adicionarRegistro}
        className="border-b border-slate-200 pb-6"
      >
        <h3 className="text-sm font-semibold text-slate-800">Novo registro</h3>
        <label className="mt-3 block text-sm font-medium text-slate-700">
          Título
          <input
            required
            maxLength={150}
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="Ex.: Apetite no almoço"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Descrição{" "}
          <span className="font-normal text-slate-400">(opcional)</span>
          <textarea
            rows={3}
            value={descricao}
            onChange={(event) => setDescricao(event.target.value)}
            className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 px-3.5 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="Descreva a observação"
          />
        </label>
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
          {salvando ? "Salvando..." : "Adicionar ao diário"}
        </button>
      </form>

      <div>
        <h3 className="text-sm font-semibold text-slate-800">
          Registros anteriores
        </h3>
        {carregando ? (
          <div className="mt-3 h-36 animate-pulse rounded-lg bg-slate-100" />
        ) : registros.length === 0 ? (
          <div className="py-10 text-center">
            <BookOpenText className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 font-semibold text-slate-700">
              Ainda não há registros
            </p>
            <p className="mt-1 text-sm text-slate-500">
              As anotações adicionadas aparecerão aqui.
            </p>
          </div>
        ) : (
          <ol className="mt-2 divide-y divide-slate-100">
            {registros.map((registro) => (
              <li key={registro.id} className="py-4">
                <article>
                  <h4 className="break-words text-sm font-semibold text-slate-900">
                    {registro.titulo}
                  </h4>
                  {registro.descricao && (
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                      {registro.descricao}
                    </p>
                  )}
                  <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatarData(registro.registrado_em)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <UserRound className="h-3.5 w-3.5" />
                      {registro.registrado_por || "Usuário"}
                    </span>
                  </p>
                </article>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

export default DiarioPaciente;
