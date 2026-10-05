import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Check,
  LockKeyhole,
  Save,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import BotaoVisual from "../components/BotaoVisual";
import startSection from "../services/startSection";
import CampoPerfil from "../components/campoPerfil";
import {
  CabecalhoMarca,
  CreditoLaboratorio,
} from "../components/IdentidadeVisual";

const campoClassName =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";

function PerfilUsuario() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState({
    id: null,
    login: "",
    nome: "",
    email: "",
    cpf: "",
    telefone: "",
    data_nascimento: "",
    sexo: "",
    foto_perfil: "",
    criado_em: "",
  });
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [senhasVisiveis, setSenhasVisiveis] = useState({});

  useEffect(() => {
    async function carregarPerfil() {
      const sessaoValida = await startSection(navigate);
      if (!sessaoValida) return;

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(import.meta.env.VITE_SERVER + "perfil", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok)
          throw new Error("Não foi possível carregar o perfil.");
        const dados = await response.json();
        setPerfil((perfilAtual) => ({ ...perfilAtual, ...dados }));
      } catch (error) {
        console.error(error);
        alert("Não foi possível carregar seus dados. Tente novamente.");
      } finally {
        setCarregando(false);
      }
    }

    carregarPerfil();
  }, [navigate]);

  function atualizarCampo(event) {
    setPerfil((perfilAtual) => ({
      ...perfilAtual,
      [event.target.name]: event.target.value,
    }));
    setSalvo(false);
  }

  function alternarVisibilidadeSenha(campo) {
    setSenhasVisiveis((senhasAtuais) => ({
      ...senhasAtuais,
      [campo]: !senhasAtuais[campo],
    }));
  }

  function selecionarFoto(event) {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;

    if (!arquivo.type.startsWith("image/")) {
      alert("Selecione um arquivo de imagem válido.");
      return;
    }

    setFoto(arquivo);
    setFotoPreview(URL.createObjectURL(arquivo));
    setSalvo(false);
  }

  async function salvarPerfil(event) {
    event.preventDefault();

    setSalvando(true);
    try {
      const dadosPerfil = new FormData();
      dadosPerfil.append("nome", perfil.nome);
      dadosPerfil.append("email", perfil.email);
      dadosPerfil.append("cpf", perfil.cpf);
      dadosPerfil.append("telefone", perfil.telefone);
      dadosPerfil.append(
        "data_nascimento",
        String(perfil.data_nascimento || "").slice(0, 10),
      );
      dadosPerfil.append("sexo", perfil.sexo);
      if (foto) dadosPerfil.append("foto_perfil", foto);

      const response = await fetch(import.meta.env.VITE_SERVER + "perfil", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: dadosPerfil,
      });

      if (!response.ok) {
        const dados = await response.json().catch(() => ({}));
        throw new Error(dados.error || "Não foi possível salvar seu perfil.");
      }

      const dados = await response.json();
      if (dados.foto_perfil) {
        setPerfil((perfilAtual) => ({
          ...perfilAtual,
          foto_perfil: dados.foto_perfil,
        }));
        setFoto(null);
        setFotoPreview("");
      }
      setSalvo(true);
    } catch (error) {
      console.error(error);
      alert(error.message || "Erro de conexão ao salvar o perfil.");
    } finally {
      setSalvando(false);
    }
  }

  async function salvarSenha(event) {
    event.preventDefault();

    if (!senhaAtual) {
      alert("Informe sua senha atual para criar uma nova senha.");
      return;
    }

    if (novaSenha.length < 6) {
      alert("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (novaSenha !== confirmacaoSenha) {
      alert("A confirmação da nova senha não coincide.");
      return;
    }

    setSalvando(true);

    try {
      const response = await fetch(
        import.meta.env.VITE_SERVER + "alterar-senha",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            id: perfil.id,
            senha: senhaAtual,
            newSenha: novaSenha,
          }),
        },
      );

      if (!response.ok) {
        if (response.status === 401) {
          alert("Senha atual incorreta.");
          return;
        }

        let mensagem = `Erro ${response.status} ao alterar a senha.`;
        try {
          const dados = await response.json();
          mensagem = dados.error || mensagem;
        } catch {
          // Mantém a mensagem baseada no status quando a resposta não é JSON.
        }
        alert(mensagem);
        return;
      }

      setSenhaAtual("");
      setNovaSenha("");
      setConfirmacaoSenha("");
      setSalvo(true);
    } catch (error) {
      console.error(error);
      alert("Erro de conexão ao alterar a senha. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  const avatar =
    fotoPreview ||
    (perfil.foto_perfil
      ? `${import.meta.env.VITE_SERVER.replace(/\/api\/?$/, "")}${perfil.foto_perfil}`
      : "");

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_right,_#d1fae5,_transparent_34%),linear-gradient(135deg,_#f8fafc_0%,_#ecfdf5_100%)]">
      <CabecalhoMarca to="/dashboard" />
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <Link
              to="/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-700"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar para pacientes
            </Link>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
              Seus dados
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Mantenha seus dados atualizados para facilitar o cuidado.
            </p>
          </div>
        </header>

        <form onSubmit={salvarPerfil} className="space-y-5">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
            <div className="flex flex-col gap-5 border-b border-slate-100 bg-slate-50/80 px-5 py-5 sm:flex-row sm:items-center sm:px-8">
              <div className="relative shrink-0">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Foto do perfil"
                    className="h-24 w-24 rounded-2xl object-cover ring-4 ring-white"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 ring-4 ring-white">
                    <UserRound className="h-10 w-10" />
                  </div>
                )}
                <label
                  htmlFor="foto-perfil"
                  className="absolute -bottom-2 -right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-emerald-600 text-white shadow-md transition hover:bg-emerald-700"
                  title="Alterar foto de perfil"
                >
                  <Camera className="h-4 w-4" />
                  <input
                    id="foto-perfil"
                    type="file"
                    accept="image/*"
                    onChange={selecionarFoto}
                    className="sr-only"
                  />
                </label>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Informações pessoais
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Escolha uma foto e confira seus dados de contato.
                </p>
              </div>
            </div>

            <div className="grid gap-5 px-5 py-6 sm:grid-cols-2 sm:px-8">
              <div className="sm:col-span-2">
                <CampoPerfil id="nome" label="Nome completo">
                  <input
                    id="nome"
                    name="nome"
                    value={perfil.nome}
                    onChange={atualizarCampo}
                    required
                    minLength="3"
                    className={campoClassName}
                    placeholder="Digite seu nome completo"
                  />
                </CampoPerfil>
              </div>
              <div>
                <CampoPerfil id="login" label="Nome de usuário (não editável)">
                  <input
                    id="login"
                    value={perfil.login}
                    readOnly
                    className={`${campoClassName} cursor-not-allowed bg-slate-50 text-slate-500`}
                  />
                </CampoPerfil>
              </div>
              <div>
                <CampoPerfil id="email" label="E-mail">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={perfil.email}
                    onChange={atualizarCampo}
                    required
                    className={campoClassName}
                    placeholder="seu@email.com"
                  />
                </CampoPerfil>
              </div>
              <div>
                <CampoPerfil id="cpf" label="CPF">
                  <input
                    id="cpf"
                    name="cpf"
                    value={perfil.cpf}
                    onChange={atualizarCampo}
                    inputMode="numeric"
                    maxLength="11"
                    required
                    className={campoClassName}
                    placeholder="Somente números"
                  />
                </CampoPerfil>
              </div>
              <div>
                <CampoPerfil id="telefone" label="Telefone">
                  <input
                    id="telefone"
                    name="telefone"
                    type="tel"
                    value={perfil.telefone}
                    onChange={atualizarCampo}
                    required
                    className={campoClassName}
                    placeholder="(00) 00000-0000"
                  />
                </CampoPerfil>
              </div>
              <div>
                <CampoPerfil id="data_nascimento" label="Data de nascimento">
                  <input
                    id="data_nascimento"
                    name="data_nascimento"
                    type="date"
                    value={String(perfil.data_nascimento || "").slice(0, 10)}
                    onChange={atualizarCampo}
                    required
                    className={campoClassName}
                  />
                </CampoPerfil>
              </div>
              <div className="sm:col-span-2">
                <CampoPerfil id="sexo" label="Sexo">
                  <select
                    id="sexo"
                    name="sexo"
                    value={perfil.sexo || ""}
                    onChange={atualizarCampo}
                    required
                    className={campoClassName}
                  >
                    <option value="" disabled>
                      Selecione uma opção
                    </option>
                    <option value="M">Homem</option>
                    <option value="F">Mulher</option>
                    <option value="Outro">Outro</option>
                  </select>
                </CampoPerfil>
              </div>
            </div>
          </section>

          <div className="flex flex-col-reverse items-stretch justify-end gap-3 pb-4 sm:flex-row sm:items-center">
            {salvo && (
              <p className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-700">
                <Check className="h-4 w-4" /> Alterações prontas
              </p>
            )}
            <Link
              to="/dashboard"
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={carregando || salvando}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />{" "}
              {salvando ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>

        <form onSubmit={salvarSenha} className="space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-8">
            <div className="mb-5 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <LockKeyhole className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Alterar senha
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Deixe os campos em branco se não quiser alterar sua senha.
                </p>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="senha-atual"
                  className="text-sm font-medium text-slate-700"
                >
                  Senha atual
                </label>
                <div className="relative">
                  <input
                    id="senha-atual"
                    type={senhasVisiveis.senhaAtual ? "text" : "password"}
                    value={senhaAtual}
                    onChange={(event) => setSenhaAtual(event.target.value)}
                    className={`${campoClassName} pr-12`}
                    placeholder="Confirme sua identidade"
                  />
                  <button
                    type="button"
                    onClick={() => alternarVisibilidadeSenha("senhaAtual")}
                    className="absolute inset-y-0 right-3 flex items-center text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={
                      senhasVisiveis.senhaAtual
                        ? "Ocultar senha atual"
                        : "Mostrar senha atual"
                    }
                    title={
                      senhasVisiveis.senhaAtual
                        ? "Ocultar senha atual"
                        : "Mostrar senha atual"
                    }
                  >
                    <BotaoVisual ver={senhasVisiveis.senhaAtual} />
                  </button>
                </div>
              </div>
              <div>
                <label
                  htmlFor="nova-senha"
                  className="text-sm font-medium text-slate-700"
                >
                  Nova senha
                </label>
                <div className="relative">
                  <input
                    id="nova-senha"
                    type={senhasVisiveis.novaSenha ? "text" : "password"}
                    value={novaSenha}
                    onChange={(event) => setNovaSenha(event.target.value)}
                    className={`${campoClassName} pr-12`}
                    placeholder="Mínimo de 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => alternarVisibilidadeSenha("novaSenha")}
                    className="absolute inset-y-0 right-3 flex items-center text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={
                      senhasVisiveis.novaSenha
                        ? "Ocultar nova senha"
                        : "Mostrar nova senha"
                    }
                    title={
                      senhasVisiveis.novaSenha
                        ? "Ocultar nova senha"
                        : "Mostrar nova senha"
                    }
                  >
                    <BotaoVisual ver={senhasVisiveis.novaSenha} />
                  </button>
                </div>
              </div>
              <div>
                <label
                  htmlFor="confirmar-senha"
                  className="text-sm font-medium text-slate-700"
                >
                  Confirmar nova senha
                </label>
                <div className="relative">
                  <input
                    id="confirmar-senha"
                    type={senhasVisiveis.confirmacaoSenha ? "text" : "password"}
                    value={confirmacaoSenha}
                    onChange={(event) =>
                      setConfirmacaoSenha(event.target.value)
                    }
                    className={`${campoClassName} pr-12`}
                    placeholder="Repita a nova senha"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      alternarVisibilidadeSenha("confirmacaoSenha")
                    }
                    className="absolute inset-y-0 right-3 flex items-center text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={
                      senhasVisiveis.confirmacaoSenha
                        ? "Ocultar confirmação da senha"
                        : "Mostrar confirmação da senha"
                    }
                    title={
                      senhasVisiveis.confirmacaoSenha
                        ? "Ocultar confirmação da senha"
                        : "Mostrar confirmação da senha"
                    }
                  >
                    <BotaoVisual ver={senhasVisiveis.confirmacaoSenha} />
                  </button>
                </div>
              </div>
              <div className={"flex col-span-3 justify-end gap-3"}>
                <button
                  type="button"
                  onClick={() => {
                    setSenhaAtual("");
                    setNovaSenha("");
                    setConfirmacaoSenha("");
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl border border-emerald-200 bg-emerald-100 px-5 py-3 text-center text-sm font-semibold text-emerald-700 transition hover:bg-emerald-200"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </section>
        </form>
      </div>
      </main>
      <CreditoLaboratorio />
    </div>
  );
}

export default PerfilUsuario;
