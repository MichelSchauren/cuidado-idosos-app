import {
  ArrowLeft,
  BookOpenText,
  CalendarDays,
  CheckSquare,
  ContactRound,
  HeartPulse,
  ImagePlus,
  LoaderCircle,
  Pencil,
  Pill,
  Save,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import startSection from "../services/startSection";
import MedicamentosPaciente from "../components/MedicamentosPaciente";
import ConsultasPaciente from "../components/ConsultasPaciente";
import TarefasPaciente from "../components/TarefasPaciente";
import DiarioPaciente from "../components/DiarioPaciente";
import {
  CabecalhoMarca,
  CreditoLaboratorio,
} from "../components/IdentidadeVisual";

const abas = [
  { id: "perfil", nome: "Resumo", Icone: ContactRound },
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

function dataParaInput(data) {
  if (!data) return "";
  if (data instanceof Date) {
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${data.getFullYear()}-${mes}-${dia}`;
  }
  return String(data).slice(0, 10);
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
  const [editando, setEditando] = useState(false);
  const [dadosEdicao, setDadosEdicao] = useState({});
  const [arquivoFoto, setArquivoFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState("");
  const [removerFoto, setRemoverFoto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroEdicao, setErroEdicao] = useState("");
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState("");

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

        if (ativa) {
          setPaciente(dados);
          setDadosEdicao(dados);
        }
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

  useEffect(() => {
    if (!fotoPreview) return undefined;
    return () => URL.revokeObjectURL(fotoPreview);
  }, [fotoPreview]);

  function iniciarEdicao() {
    setDadosEdicao({ ...paciente });
    setArquivoFoto(null);
    setFotoPreview("");
    setRemoverFoto(false);
    setErroEdicao("");
    setEditando(true);
  }

  function cancelarEdicao() {
    setDadosEdicao({ ...paciente });
    setArquivoFoto(null);
    setFotoPreview("");
    setRemoverFoto(false);
    setErroEdicao("");
    setEditando(false);
  }

  function atualizarCampo(event) {
    const { name, value } = event.target;
    setDadosEdicao((dadosAtuais) => ({ ...dadosAtuais, [name]: value }));
  }

  function selecionarFoto(event) {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;
    if (!arquivo.type.startsWith("image/")) {
      setErroEdicao("Selecione um arquivo de imagem válido.");
      event.target.value = "";
      return;
    }

    setArquivoFoto(arquivo);
    setFotoPreview(URL.createObjectURL(arquivo));
    setRemoverFoto(false);
    setErroEdicao("");
  }

  async function salvarEdicao(event) {
    event.preventDefault();
    setSalvando(true);
    setErroEdicao("");

    const dados = new FormData();
    [
      "nome",
      "cpf",
      "data_nascimento",
      "telefone",
      "endereco",
      "status_atencao",
      "observacoes",
    ].forEach((campo) => {
      const valor =
        campo === "data_nascimento"
          ? dataParaInput(dadosEdicao[campo])
          : dadosEdicao[campo] || "";
      dados.append(campo, valor);
    });
    if (arquivoFoto) dados.append("foto", arquivoFoto);
    dados.append("remover_foto", String(removerFoto));

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}pacientes/${encodeURIComponent(id)}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: dados,
        },
      );
      const resultado = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(resultado.error || "Não foi possível salvar o perfil.");
      }

      setPaciente(resultado.paciente);
      setDadosEdicao(resultado.paciente);
      setArquivoFoto(null);
      setFotoPreview("");
      setRemoverFoto(false);
      setEditando(false);
    } catch (error) {
      setErroEdicao(error.message || "Erro ao salvar as alterações.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluirPaciente() {
    const confirmou = window.confirm(
      `Excluir permanentemente o perfil de ${paciente.nome}? Esta ação não pode ser desfeita.`,
    );
    if (!confirmou) return;

    setExcluindo(true);
    setErroExclusao("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}pacientes/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      const resultado = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          resultado.error || "Não foi possível excluir o paciente.",
        );
      }

      navigate("/dashboard", { replace: true });
    } catch (error) {
      setErroExclusao(error.message || "Erro ao excluir o paciente.");
    } finally {
      setExcluindo(false);
    }
  }

  if (!aba) return <Navigate to={`/paciente/${id}/perfil`} replace />;
  if (!abas.some((item) => item.id === aba)) {
    return <Navigate to={`/paciente/${id}/perfil`} replace />;
  }

  const fotoPaciente = fotoPreview || (removerFoto ? "" : paciente?.foto);
  const avatar = fotoPaciente
    ? `${import.meta.env.VITE_SERVER.replace(/\/api\/?$/, "")}${fotoPaciente}`
    : "";
  const classeStatus =
    statusClasses[paciente?.status_atencao] ||
    "border-slate-200 bg-slate-100 text-slate-700";

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_right,_#d1fae5,_transparent_30%),linear-gradient(135deg,_#f8fafc_0%,_#f0fdfa_100%)]">
      <CabecalhoMarca to="/dashboard" />
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6">
          <Link
            to="/dashboard"
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-700"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar à lista
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
            aria-label="Resumo do paciente"
            className="rounded-lg border border-slate-200 bg-white px-5 shadow-sm sm:px-8"
          >
            <div className="flex flex-col gap-3 border-b border-slate-100 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Dados do paciente
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Informações pessoais e orientações para o cuidado.
                </p>
              </div>
              {!editando && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={iniciarEdicao}
                    className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Pencil className="h-4 w-4" /> Editar dados
                  </button>
                  <button
                    type="button"
                    onClick={excluirPaciente}
                    disabled={excluindo}
                    className="inline-flex w-fit items-center gap-2 rounded-lg border border-rose-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60"
                  >
                    {excluindo ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    {excluindo ? "Excluindo..." : "Excluir paciente"}
                  </button>
                </div>
              )}
            </div>

            {erroExclusao && (
              <p
                role="alert"
                className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
              >
                {erroExclusao}
              </p>
            )}

            {editando ? (
              <form onSubmit={salvarEdicao} className="py-5">
                {erroEdicao && (
                  <p
                    role="alert"
                    className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                  >
                    {erroEdicao}
                  </p>
                )}
                <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="nome"
                      className="text-sm font-medium text-slate-700"
                    >
                      Nome completo
                    </label>
                    <input
                      id="nome"
                      name="nome"
                      value={dadosEdicao.nome || ""}
                      onChange={atualizarCampo}
                      maxLength="150"
                      required
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="cpf"
                      className="text-sm font-medium text-slate-700"
                    >
                      CPF
                    </label>
                    <input
                      id="cpf"
                      name="cpf"
                      value={dadosEdicao.cpf || ""}
                      onChange={atualizarCampo}
                      inputMode="numeric"
                      maxLength="11"
                      pattern="[0-9]{11}"
                      required
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="data_nascimento"
                      className="text-sm font-medium text-slate-700"
                    >
                      Nascimento
                    </label>
                    <input
                      id="data_nascimento"
                      name="data_nascimento"
                      type="date"
                      value={dataParaInput(dadosEdicao.data_nascimento)}
                      onChange={atualizarCampo}
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="telefone"
                      className="text-sm font-medium text-slate-700"
                    >
                      Telefone
                    </label>
                    <input
                      id="telefone"
                      name="telefone"
                      type="tel"
                      value={dadosEdicao.telefone || ""}
                      onChange={atualizarCampo}
                      maxLength="20"
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="status_atencao"
                      className="text-sm font-medium text-slate-700"
                    >
                      Status de atenção
                    </label>
                    <select
                      id="status_atencao"
                      name="status_atencao"
                      value={dadosEdicao.status_atencao || "Estável"}
                      onChange={atualizarCampo}
                      required
                      className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    >
                      <option value="Estável">Estável</option>
                      <option value="Atenção">Atenção</option>
                      <option value="Crítico">Crítico</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="endereco"
                      className="text-sm font-medium text-slate-700"
                    >
                      Endereço
                    </label>
                    <textarea
                      id="endereco"
                      name="endereco"
                      rows="2"
                      value={dadosEdicao.endereco || ""}
                      onChange={atualizarCampo}
                      className="mt-2 w-full resize-y rounded-lg border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="observacoes"
                      className="text-sm font-medium text-slate-700"
                    >
                      Observações
                    </label>
                    <textarea
                      id="observacoes"
                      name="observacoes"
                      rows="4"
                      value={dadosEdicao.observacoes || ""}
                      onChange={atualizarCampo}
                      className="mt-2 w-full resize-y rounded-lg border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-sm font-medium text-slate-700">
                      Foto do paciente
                    </span>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt="Prévia da foto do paciente"
                          className="h-16 w-16 rounded-xl object-cover"
                        />
                      ) : (
                        <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                          <UserRound className="h-7 w-7" />
                        </span>
                      )}
                      <label
                        htmlFor="foto-paciente"
                        className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <ImagePlus className="h-4 w-4" /> Escolher foto
                        <input
                          id="foto-paciente"
                          type="file"
                          accept="image/*"
                          onChange={selecionarFoto}
                          className="sr-only"
                        />
                      </label>
                      {fotoPaciente && (
                        <button
                          type="button"
                          onClick={() => {
                            setArquivoFoto(null);
                            setFotoPreview("");
                            setRemoverFoto(true);
                          }}
                          className="inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" /> Remover foto
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Imagens de até 5 MB.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={cancelarEdicao}
                    disabled={salvando}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    <X className="h-4 w-4" /> Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvando}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
                  >
                    {salvando ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" /> Salvar alterações
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
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
            )}
          </section>
        ) : aba === "medicamentos" ? (
          <MedicamentosPaciente
            pacienteId={id}
            tipoUsuario={paciente.tipo_usuario}
          />
        ) : aba === "tarefas" ? (
          <TarefasPaciente
            pacienteId={id}
            tipoUsuario={paciente.tipo_usuario}
          />
        ) : aba === "consultas" ? (
          <ConsultasPaciente
            pacienteId={id}
            tipoUsuario={paciente.tipo_usuario}
          />
        ) : aba === "diario" ? (
          <DiarioPaciente pacienteId={id} />
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
      <CreditoLaboratorio />
    </div>
  );
}

export default Paciente;
