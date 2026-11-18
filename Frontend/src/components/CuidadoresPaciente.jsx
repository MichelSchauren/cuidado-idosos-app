import {
  Info,
  LoaderCircle,
  Search,
  Trash2,
  UserPlus,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

async function lerResposta(response, mensagemPadrao) {
  const dados = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(dados.error || mensagemPadrao);
  }
  return dados;
}

function detalhesPerfil(perfil) {
  const idade =
    perfil.idade === null || perfil.idade === undefined
      ? "Idade não informada"
      : `${perfil.idade} anos`;
  return `${idade} · ${perfil.genero || "Gênero não informado"}`;
}

function CartaoVinculados({
  titulo,
  tipo,
  perfis,
  podeGerenciar,
  desvinculandoId,
  onDesvincular,
}) {
  const nomeTipo = tipo === "responsavel" ? "responsável" : "cuidador";

  return (
    <section
      aria-label={titulo}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
          <UsersRound className="h-4 w-4 text-emerald-700" />
          {titulo}
        </h3>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {perfis.length}
        </span>
      </div>

      {perfis.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
          Nenhum {nomeTipo} vinculado.
        </p>
      ) : (
        <ul className="space-y-2">
          {perfis.map((perfil) => {
            const ultimoResponsavel =
              tipo === "responsavel" && perfis.length === 1;
            const naoPodeDesvincular =
              perfil.souEu || ultimoResponsavel || !podeGerenciar;

            return (
              <li
                key={perfil.id}
                className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <UserRound className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {perfil.nome}
                  </p>
                  <p className="text-xs text-slate-500">
                    {detalhesPerfil(perfil)}
                  </p>
                </div>
                {podeGerenciar && naoPodeDesvincular ? (
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                    {perfil.souEu ? "Você" : "Último responsável"}
                  </span>
                ) : podeGerenciar ? (
                  <button
                    type="button"
                    onClick={() => onDesvincular(perfil)}
                    disabled={Boolean(desvinculandoId)}
                    aria-label={`Desvincular ${perfil.nome}`}
                    title={`Desvincular ${perfil.nome}`}
                    className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:cursor-wait disabled:opacity-50"
                  >
                    {desvinculandoId === `${perfil.tipo}-${perfil.id}` ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function CuidadoresPaciente({ pacienteId }) {
  const [vinculos, setVinculos] = useState({
    responsaveis: [],
    cuidadores: [],
    podeGerenciar: false,
    podeVincularCuidador: false,
  });
  const [carregandoVinculos, setCarregandoVinculos] = useState(true);
  const [erroVinculos, setErroVinculos] = useState("");
  const [filtros, setFiltros] = useState({
    nome: "",
    idadeMinima: "",
    idadeMaxima: "",
    genero: "todos",
    tipo: "todos",
  });
  const [filtrosAplicados, setFiltrosAplicados] = useState(null);
  const [resultados, setResultados] = useState([]);
  const [buscaExecutada, setBuscaExecutada] = useState(false);
  const [pesquisando, setPesquisando] = useState(false);
  const [operacaoId, setOperacaoId] = useState("");
  const [erroBusca, setErroBusca] = useState("");
  const [erroOperacao, setErroOperacao] = useState("");

  const carregarVinculos = useCallback(async () => {
    setCarregandoVinculos(true);
    setErroVinculos("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}pacientes/${encodeURIComponent(pacienteId)}/vinculos`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      const dados = await lerResposta(
        response,
        "Não foi possível carregar os vínculos.",
      );

      if (
        !Array.isArray(dados.responsaveis) ||
        !Array.isArray(dados.cuidadores) ||
        typeof dados.podeGerenciar !== "boolean" ||
        typeof dados.podeVincularCuidador !== "boolean"
      ) {
        throw new Error("O servidor retornou vínculos em formato inválido.");
      }

      setVinculos(dados);
    } catch (error) {
      setErroVinculos(error.message || "Erro ao carregar os vínculos.");
    } finally {
      setCarregandoVinculos(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    carregarVinculos();
  }, [carregarVinculos]);

  const responsaveis = vinculos.responsaveis;
  const cuidadores = vinculos.cuidadores;

  function atualizarFiltro(event) {
    const { name, value } = event.target;
    setFiltros((atuais) => ({ ...atuais, [name]: value }));
  }

  async function buscarNaApi(filtrosBusca) {
    const parametros = new URLSearchParams({
      nome: filtrosBusca.nome.trim(),
      tipo: filtrosBusca.tipo,
      genero: filtrosBusca.genero,
    });
    if (filtrosBusca.idadeMinima !== "") {
      parametros.set("idadeMinima", filtrosBusca.idadeMinima);
    }
    if (filtrosBusca.idadeMaxima !== "") {
      parametros.set("idadeMaxima", filtrosBusca.idadeMaxima);
    }

    const response = await fetch(
      `${import.meta.env.VITE_SERVER}pacientes/${encodeURIComponent(pacienteId)}/perfis-disponiveis?${parametros}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );
    const dados = await lerResposta(
      response,
      "Não foi possível pesquisar perfis.",
    );
    if (!Array.isArray(dados)) {
      throw new Error("O servidor retornou resultados em formato inválido.");
    }
    return dados;
  }

  async function buscarPerfis(event) {
    event.preventDefault();
    setPesquisando(true);
    setErroBusca("");
    setResultados([]);
    setBuscaExecutada(true);

    try {
      const perfis = await buscarNaApi(filtros);
      setResultados(perfis);
      setFiltrosAplicados({ ...filtros });
      setBuscaExecutada(true);
    } catch (error) {
      setErroBusca(error.message || "Erro ao pesquisar perfis.");
    } finally {
      setPesquisando(false);
    }
  }

  async function vincular(perfil) {
    const chavePerfil = `${perfil.tipo}-${perfil.id}`;
    setOperacaoId(chavePerfil);
    setErroOperacao("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}pacientes/${encodeURIComponent(pacienteId)}/vinculos`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ tipo: perfil.tipo, perfilId: perfil.id }),
        },
      );
      await lerResposta(response, "Não foi possível vincular este perfil.");
      setResultados((atuais) =>
        atuais.filter(
          (resultado) =>
            resultado.tipo !== perfil.tipo || resultado.id !== perfil.id,
        ),
      );
      await carregarVinculos();
    } catch (error) {
      setErroOperacao(error.message || "Erro ao vincular perfil.");
    } finally {
      setOperacaoId("");
    }
  }

  async function desvincular(perfil) {
    const chavePerfil = `${perfil.tipo}-${perfil.id}`;
    setOperacaoId(chavePerfil);
    setErroOperacao("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}pacientes/${encodeURIComponent(pacienteId)}/vinculos/${encodeURIComponent(perfil.tipo)}/${encodeURIComponent(perfil.id)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      await lerResposta(response, "Não foi possível desvincular este perfil.");
      await carregarVinculos();

      if (buscaExecutada && filtrosAplicados) {
        try {
          setResultados(await buscarNaApi(filtrosAplicados));
        } catch (error) {
          setResultados([]);
          setErroBusca(error.message || "Erro ao atualizar a pesquisa.");
        }
      }
    } catch (error) {
      setErroOperacao(error.message || "Erro ao desvincular perfil.");
    } finally {
      setOperacaoId("");
    }
  }

  return (
    <section
      role="tabpanel"
      aria-label="Cuidadores e responsáveis"
      className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Vincular ao paciente
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Pesquise responsáveis e cuidadores para adicionar.
          </p>
        </div>

        {erroVinculos && (
          <div
            role="alert"
            className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800"
          >
            <span>{erroVinculos}</span>
            <button
              type="button"
              onClick={carregarVinculos}
              className="shrink-0 font-semibold underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        <form onSubmit={buscarPerfis} className="space-y-4">
          <fieldset
            disabled={
              !vinculos.podeGerenciar ||
              carregandoVinculos ||
              Boolean(operacaoId)
            }
            className="space-y-4 disabled:opacity-60"
          >
            <div>
              <label
                htmlFor="busca-perfis-nome"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Pesquisar por nome
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="busca-perfis-nome"
                  name="nome"
                  type="search"
                  value={filtros.nome}
                  onChange={atualizarFiltro}
                  placeholder="Digite ao menos 2 caracteres"
                  minLength={2}
                  maxLength={150}
                  required
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="idade-minima-perfil"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Idade mínima
                </label>
                <input
                  id="idade-minima-perfil"
                  name="idadeMinima"
                  type="number"
                  step="1"
                  min="0"
                  max="120"
                  value={filtros.idadeMinima}
                  onChange={atualizarFiltro}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
              <div>
                <label
                  htmlFor="idade-maxima-perfil"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Idade máxima
                </label>
                <input
                  id="idade-maxima-perfil"
                  name="idadeMaxima"
                  type="number"
                  step="1"
                  min="0"
                  max="120"
                  value={filtros.idadeMaxima}
                  onChange={atualizarFiltro}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="genero-perfil"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Gênero
                </label>
                <select
                  id="genero-perfil"
                  name="genero"
                  value={filtros.genero}
                  onChange={atualizarFiltro}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="todos">Todos</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="tipo-perfil"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Tipo
                </label>
                <select
                  id="tipo-perfil"
                  name="tipo"
                  value={filtros.tipo}
                  onChange={atualizarFiltro}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="todos">Todos os tipos</option>
                  <option
                    value="cuidador"
                    disabled={!vinculos.podeVincularCuidador}
                  >
                    Cuidador
                  </option>
                  <option value="responsavel">Responsável</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={pesquisando || Boolean(operacaoId)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:cursor-wait disabled:opacity-60"
            >
              {pesquisando ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {pesquisando ? "Buscando..." : "Buscar perfis"}
            </button>
          </fieldset>
        </form>

        {erroBusca && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            {erroBusca}
          </p>
        )}
        {erroOperacao && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            {erroOperacao}
          </p>
        )}

        <div className="mt-5 border-t border-slate-100 pt-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">
            Perfis encontrados {buscaExecutada && `(${resultados.length})`}
          </h3>
          {!buscaExecutada ? (
            <p className="rounded-xl bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
              Pesquise pelo nome para encontrar perfis disponíveis.
            </p>
          ) : resultados.length === 0 ? (
            <p className="rounded-xl bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
              Nenhum perfil encontrado. Ajuste os filtros e tente novamente.
            </p>
          ) : (
            <ul className="space-y-2">
              {resultados.map((perfil) => (
                <li
                  key={`${perfil.tipo}-${perfil.id}`}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <UserRound className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {perfil.nome}
                    </p>
                    <p className="text-xs text-slate-500">
                      {perfil.tipo === "responsavel"
                        ? "Responsável"
                        : "Cuidador"}{" "}
                      · {detalhesPerfil(perfil)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => vincular(perfil)}
                    disabled={
                      Boolean(operacaoId) ||
                      pesquisando ||
                      (perfil.tipo === "cuidador" &&
                        !vinculos.podeVincularCuidador)
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:cursor-wait disabled:opacity-60"
                  >
                    {operacaoId === `${perfil.tipo}-${perfil.id}` ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    Vincular
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Pessoas vinculadas
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Responsáveis e cuidadores que acompanham este paciente.
          </p>
        </div>
        {carregandoVinculos && (
          <p className="text-sm text-slate-500">Carregando vínculos...</p>
        )}
        {erroVinculos ? null : (
          <>
            <CartaoVinculados
              titulo="Responsáveis"
              tipo="responsavel"
              perfis={responsaveis}
              podeGerenciar={vinculos.podeGerenciar}
              desvinculandoId={operacaoId}
              onDesvincular={desvincular}
            />
            <CartaoVinculados
              titulo="Cuidadores"
              tipo="cuidador"
              perfis={cuidadores}
              podeGerenciar={vinculos.podeGerenciar}
              desvinculandoId={operacaoId}
              onDesvincular={desvincular}
            />
          </>
        )}
      </div>
    </section>
  );
}

export default CuidadoresPaciente;
