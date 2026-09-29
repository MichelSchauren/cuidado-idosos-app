import {
  ArrowLeft,
  Check,
  ImagePlus,
  LoaderCircle,
  MapPin,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const campoClassName =
  "mt-2 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";

const statusAtencao = [
  {
    valor: "Estável",
    descricao: "Acompanhamento de rotina",
    classesMarcadas:
      "has-[:checked]:border-emerald-300 has-[:checked]:bg-emerald-50",
    classeRadio: "accent-emerald-600",
  },
  {
    valor: "Atenção",
    descricao: "Precisa de observação",
    classesMarcadas:
      "has-[:checked]:border-amber-300 has-[:checked]:bg-amber-50",
    classeRadio: "accent-amber-600",
  },
  {
    valor: "Crítico",
    descricao: "Requer cuidado imediato",
    classesMarcadas: "has-[:checked]:border-rose-300 has-[:checked]:bg-rose-50",
    classeRadio: "accent-rose-600",
  },
];

function AddPaciente() {
  const navigate = useNavigate();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [nomeFoto, setNomeFoto] = useState("");

  async function salvarPaciente(event) {
    event.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      const response = await fetch(import.meta.env.VITE_SERVER + "pacientes", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: new FormData(event.currentTarget),
      });
      const dados = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          dados.error || "Não foi possível cadastrar o paciente.",
        );
      }

      navigate("/dashboard");
    } catch (error) {
      setErro(error.message || "Erro de conexão. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#d1fae5,_transparent_32%),linear-gradient(135deg,_#f8fafc_0%,_#f0fdfa_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <Link
            to="/dashboard"
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-700"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar para pacientes
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Cadastro de paciente
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                Adicionar paciente
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Registre as informações essenciais para organizar o cuidado e o
                acompanhamento.
              </p>
            </div>
          </div>
        </header>

        <form
          onSubmit={salvarPaciente}
          className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12"
        >
          <div className="space-y-8">
            <section aria-labelledby="dados-pessoais-titulo">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                  <UserRound className="h-5 w-5" />
                </span>
                <div>
                  <h2
                    id="dados-pessoais-titulo"
                    className="text-lg font-semibold text-slate-900"
                  >
                    Dados pessoais
                  </h2>
                  <p className="text-sm text-slate-500">
                    Identificação e informações de contato.
                  </p>
                </div>
              </div>

              <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
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
                    type="text"
                    autoComplete="name"
                    required
                    className={campoClassName}
                    placeholder="Nome e sobrenome"
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
                    type="text"
                    inputMode="numeric"
                    maxLength="11"
                    required
                    className={campoClassName}
                    placeholder="Somente números"
                  />
                </div>

                <div>
                  <label
                    htmlFor="data_nascimento"
                    className="text-sm font-medium text-slate-700"
                  >
                    Data de nascimento
                  </label>
                  <input
                    id="data_nascimento"
                    name="data_nascimento"
                    type="date"
                    className={campoClassName}
                  />
                </div>

                <div>
                  <label
                    htmlFor="sexo"
                    className="text-sm font-medium text-slate-700"
                  >
                    Sexo
                  </label>
                  <select
                    id="sexo"
                    name="sexo"
                    defaultValue=""
                    className={campoClassName}
                  >
                    <option value="" disabled>
                      Selecione uma opção
                    </option>
                    <option value="M">Homem</option>
                    <option value="F">Mulher</option>
                    <option value="Outro">Outro</option>
                  </select>
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
                    autoComplete="tel"
                    className={campoClassName}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="endereco"
                    className="flex items-center gap-2 text-sm font-medium text-slate-700"
                  >
                    <MapPin className="h-4 w-4 text-emerald-700" /> Endereço
                  </label>
                  <textarea
                    id="endereco"
                    name="endereco"
                    rows="2"
                    className={`${campoClassName} resize-y`}
                    placeholder="Rua, número, bairro, cidade"
                  />
                </div>
              </div>
            </section>

            <section
              aria-labelledby="observacoes-titulo"
              className="border-t border-slate-200 pt-7"
            >
              <label
                id="observacoes-titulo"
                htmlFor="observacoes"
                className="text-sm font-semibold text-slate-800"
              >
                Observações importantes
              </label>
              <textarea
                id="observacoes"
                name="observacoes"
                rows="4"
                className={`${campoClassName} resize-y`}
                placeholder="Informações relevantes para o cuidado diário"
              />
            </section>
          </div>

          <aside className="space-y-8 border-t border-slate-200 pt-7 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <section aria-labelledby="foto-titulo">
              <h2
                id="foto-titulo"
                className="text-sm font-semibold text-slate-800"
              >
                Foto do paciente
              </h2>
              <label
                htmlFor="foto"
                className="mt-3 flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-emerald-300 bg-white/80 px-5 py-6 text-center transition hover:border-emerald-500 hover:bg-emerald-50/70"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                  <ImagePlus className="h-6 w-6" />
                </span>
                <span className="mt-4 max-w-full truncate text-sm font-semibold text-slate-800">
                  {nomeFoto || "Escolher uma foto"}
                </span>
                <span className="mt-1 text-xs leading-5 text-slate-500">
                  JPG, PNG ou WEBP
                </span>
                <input
                  id="foto"
                  name="foto"
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setNomeFoto(event.target.files?.[0]?.name || "")
                  }
                  className="sr-only"
                />
              </label>
            </section>

            <fieldset>
              <legend className="text-sm font-semibold text-slate-800">
                Estado de atenção
              </legend>
              <div className="mt-3 space-y-2">
                {statusAtencao.map(
                  (
                    { valor, descricao, classesMarcadas, classeRadio },
                    index,
                  ) => (
                    <label
                      key={valor}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-3 transition ${classesMarcadas}`}
                    >
                      <input
                        type="radio"
                        name="status_atencao"
                        value={valor}
                        defaultChecked={index === 0}
                        className={`mt-1 h-4 w-4 ${classeRadio}`}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-800">
                          {valor}
                        </span>
                        <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                          {descricao}
                        </span>
                      </span>
                    </label>
                  ),
                )}
              </div>
            </fieldset>
          </aside>

          <footer className="space-y-4 border-t border-slate-200 pt-5 lg:col-span-2">
            {erro && (
              <p
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
              >
                {erro}
              </p>
            )}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={salvando}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-wait disabled:opacity-60"
              >
                {salvando ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Salvar paciente
                  </>
                )}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </main>
  );
}

export default AddPaciente;
