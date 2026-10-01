import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  PackagePlus,
  Pill,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function dataLocalAtual() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

async function respostaJson(response) {
  if (response.status === 204) return {};
  return response.json().catch(() => ({}));
}

function cabecalhosAutenticados() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };
}

function MedicamentosPaciente({ pacienteId, tipoUsuario }) {
  const [medicamentos, setMedicamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [doseEmAndamento, setDoseEmAndamento] = useState(null);
  const [estoques, setEstoques] = useState({});
  const [formulario, setFormulario] = useState({
    nome: "",
    quantidade_comprimidos: "",
    horarios: ["08:00"],
  });

  const responsavel = tipoUsuario === "responsavel";
  const cuidador = tipoUsuario === "cuidador";
  const hoje = dataLocalAtual();
  const baseUrl = `${import.meta.env.VITE_SERVER}pacientes/${encodeURIComponent(pacienteId)}/medicamentos`;
  const carregarMedicamentos = useCallback(async () => {
    setErro("");
    try {
      const response = await fetch(`${baseUrl}?data=${hoje}`, {
        headers: cabecalhosAutenticados(),
      });
      const dados = await respostaJson(response);
      if (!response.ok) {
        throw new Error(dados.error || "Não foi possível carregar os medicamentos.");
      }
      setMedicamentos(Array.isArray(dados) ? dados : []);
    } catch (error) {
      setErro(error.message || "Erro ao carregar medicamentos.");
    } finally {
      setCarregando(false);
    }
  }, [baseUrl, hoje]);

  useEffect(() => {
    carregarMedicamentos();
  }, [carregarMedicamentos]);

  function atualizarHorario(indice, valor) {
    setFormulario((atual) => ({
      ...atual,
      horarios: atual.horarios.map((horario, i) => (i === indice ? valor : horario)),
    }));
  }

  function adicionarHorario() {
    setFormulario((atual) => ({ ...atual, horarios: [...atual.horarios, ""] }));
  }

  function removerHorario(indice) {
    setFormulario((atual) => ({
      ...atual,
      horarios: atual.horarios.filter((_, i) => i !== indice),
    }));
  }

  async function cadastrar(event) {
    event.preventDefault();
    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: cabecalhosAutenticados(),
        body: JSON.stringify({
          ...formulario,
          quantidade_comprimidos: Number(formulario.quantidade_comprimidos),
        }),
      });
      const dados = await respostaJson(response);
      if (!response.ok) throw new Error(dados.error || "Erro ao adicionar medicamento.");

      setFormulario({ nome: "", quantidade_comprimidos: "", horarios: ["08:00"] });
      setMostrarFormulario(false);
      setMensagem("Medicamento adicionado com sucesso.");
      await carregarMedicamentos();
    } catch (error) {
      setErro(error.message || "Erro ao adicionar medicamento.");
    } finally {
      setSalvando(false);
    }
  }

  async function remover(medicamento) {
    const confirmou = window.confirm(
      `Remover ${medicamento.nome}? O histórico de doses desse medicamento também será removido.`,
    );
    if (!confirmou) return;

    setErro("");
    setMensagem("");
    try {
      const response = await fetch(`${baseUrl}/${medicamento.id}`, {
        method: "DELETE",
        headers: cabecalhosAutenticados(),
      });
      const dados = await respostaJson(response);
      if (!response.ok) throw new Error(dados.error || "Erro ao remover medicamento.");
      setMensagem("Medicamento removido.");
      await carregarMedicamentos();
    } catch (error) {
      setErro(error.message || "Erro ao remover medicamento.");
    }
  }

  async function adicionarEstoque(medicamentoId) {
    const quantidade = Number(estoques[medicamentoId]);
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      setErro("Informe quantos comprimidos deseja adicionar ao estoque.");
      return;
    }

    setErro("");
    setMensagem("");
    try {
      const response = await fetch(`${baseUrl}/${medicamentoId}/estoque`, {
        method: "PATCH",
        headers: cabecalhosAutenticados(),
        body: JSON.stringify({ quantidade }),
      });
      const dados = await respostaJson(response);
      if (!response.ok) throw new Error(dados.error || "Erro ao atualizar estoque.");
      setEstoques((atual) => ({ ...atual, [medicamentoId]: "" }));
      setMensagem(`${quantidade} comprimido(s) adicionado(s) ao estoque.`);
      await carregarMedicamentos();
    } catch (error) {
      setErro(error.message || "Erro ao atualizar estoque.");
    }
  }

  async function registrarDose(medicamento, horario) {
    if (horario.administrado || medicamento.quantidade_comprimidos <= 0) return;
    setDoseEmAndamento(horario.id);
    setErro("");
    setMensagem("");
    try {
      const response = await fetch(
        `${baseUrl}/${medicamento.id}/horarios/${horario.id}/administracoes`,
        {
          method: "POST",
          headers: cabecalhosAutenticados(),
          body: JSON.stringify({ data: hoje }),
        },
      );
      const dados = await respostaJson(response);
      if (!response.ok) throw new Error(dados.error || "Erro ao registrar a dose.");
      setMensagem(`Dose de ${medicamento.nome}, das ${horario.horario}, registrada.`);
      await carregarMedicamentos();
    } catch (error) {
      setErro(error.message || "Erro ao registrar a dose.");
    } finally {
      setDoseEmAndamento(null);
    }
  }

  return (
    <section role="tabpanel" aria-label="Medicamentos" className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Pill className="h-5 w-5 text-emerald-700" /> Medicamentos
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {cuidador
              ? "Marque a dose somente depois de entregar o comprimido ao paciente."
              : "Gerencie prescrições, horários e a quantidade disponível."}
          </p>
        </div>
        {responsavel && (
          <button
            type="button"
            onClick={() => setMostrarFormulario((valor) => !valor)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            {mostrarFormulario ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {mostrarFormulario ? "Cancelar" : "Adicionar medicamento"}
          </button>
        )}
      </div>

      {erro && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {erro}
        </div>
      )}
      {mensagem && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {mensagem}
        </div>
      )}

      {responsavel && mostrarFormulario && (
        <form onSubmit={cadastrar} className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
          <h3 className="font-semibold text-slate-900">Novo medicamento</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Nome do medicamento
              <input
                required
                maxLength={150}
                value={formulario.nome}
                onChange={(event) => setFormulario((atual) => ({ ...atual, nome: event.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="Ex.: Losartana"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Comprimidos disponíveis
              <input
                required
                type="number"
                min="0"
                max="1000000"
                value={formulario.quantidade_comprimidos}
                onChange={(event) => setFormulario((atual) => ({ ...atual, quantidade_comprimidos: event.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="Ex.: 30"
              />
            </label>
          </div>

          <fieldset className="mt-4">
            <legend className="text-sm font-semibold text-slate-700">Horários diários</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {formulario.horarios.map((horario, indice) => (
                <div key={indice} className="flex items-center gap-1">
                  <input
                    required
                    type="time"
                    value={horario}
                    onChange={(event) => atualizarHorario(indice, event.target.value)}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-emerald-500"
                    aria-label={`Horário ${indice + 1}`}
                  />
                  {formulario.horarios.length > 1 && (
                    <button type="button" onClick={() => removerHorario(indice)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-100 hover:text-rose-700" aria-label={`Remover horário ${indice + 1}`}>
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={adicionarHorario} className="inline-flex items-center gap-1 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
                <Plus className="h-4 w-4" /> Outro horário
              </button>
            </div>
          </fieldset>

          <button disabled={salvando} className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60">
            {salvando ? "Salvando..." : "Salvar medicamento"}
          </button>
        </form>
      )}

      {carregando ? (
        <div className="h-48 animate-pulse rounded-2xl bg-white" />
      ) : medicamentos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-14 text-center">
          <Pill className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 font-semibold text-slate-700">Nenhum medicamento cadastrado</p>
          <p className="mt-1 text-sm text-slate-500">
            {responsavel ? "Use o botão acima para adicionar o primeiro." : "O responsável ainda não adicionou medicamentos."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {medicamentos.map((medicamento) => {
            const semEstoque = medicamento.quantidade_comprimidos === 0;
            return (
              <article key={medicamento.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
                  <div className="min-w-0">
                    <h3 className="break-words text-lg font-semibold text-slate-900">{medicamento.nome}</h3>
                    <p className={`mt-1 inline-flex items-center gap-1.5 text-sm font-semibold ${semEstoque ? "text-rose-700" : "text-emerald-700"}`}>
                      {semEstoque && <AlertTriangle className="h-4 w-4" />}
                      {medicamento.quantidade_comprimidos} comprimido(s) disponível(is)
                    </p>
                  </div>
                  {responsavel && (
                    <button type="button" onClick={() => remover(medicamento)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-700" aria-label={`Remover ${medicamento.nome}`}>
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <div className="p-5">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Clock3 className="h-4 w-4" /> Doses de hoje
                  </p>
                  <div className="mt-3 space-y-2">
                    {medicamento.horarios.map((horario) => (
                      <label key={horario.id} className={`flex items-center justify-between rounded-xl border px-3 py-3 ${horario.administrado ? "border-emerald-200 bg-emerald-50" : "border-slate-200"}`}>
                        <span className="font-semibold text-slate-800">{horario.horario}</span>
                        <span className="flex items-center gap-2 text-sm text-slate-600">
                          {horario.administrado ? "Dose administrada" : semEstoque ? "Sem estoque" : "Aguardando"}
                          {cuidador ? (
                            <input
                              type="checkbox"
                              checked={horario.administrado}
                              disabled={horario.administrado || semEstoque || doseEmAndamento === horario.id}
                              onChange={() => registrarDose(medicamento, horario)}
                              className="h-5 w-5 rounded border-slate-300 accent-emerald-600"
                              aria-label={`Registrar dose de ${medicamento.nome} às ${horario.horario}`}
                            />
                          ) : horario.administrado ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          ) : null}
                        </span>
                      </label>
                    ))}
                  </div>

                  {responsavel && (
                    <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row">
                      <input
                        type="number"
                        min="1"
                        max="1000000"
                        value={estoques[medicamento.id] || ""}
                        onChange={(event) => setEstoques((atual) => ({ ...atual, [medicamento.id]: event.target.value }))}
                        className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                        placeholder="Quantidade para repor"
                        aria-label={`Quantidade para adicionar ao estoque de ${medicamento.nome}`}
                      />
                      <button type="button" onClick={() => adicionarEstoque(medicamento.id)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
                        <PackagePlus className="h-4 w-4" /> Adicionar estoque
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default MedicamentosPaciente;
