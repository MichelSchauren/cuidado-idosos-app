import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CadastroResponsavel from "../components/CadastroResponsavel";
import CadastroCuidador from "../components/CadastroCuidador";
import {
  CabecalhoMarca,
  CreditoLaboratorio,
} from "../components/IdentidadeVisual";

function formatarDataParaInput(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function nomeCompletoValido(nome) {
  const nomeNormalizado = nome.trim().replace(/\s+/g, " ");
  return /^[\p{L}]+(?:[ '-][\p{L}]+)*(?:\s+[\p{L}]+(?:[ '-][\p{L}]+)*)+$/u.test(
    nomeNormalizado,
  );
}

function maiorDeIdade(dataNascimento) {
  const partesData = dataNascimento.split("-").map(Number);
  if (partesData.length !== 3 || partesData.some(Number.isNaN)) return false;

  const [ano, mes, dia] = partesData;
  const nascimento = new Date(ano, mes - 1, dia);
  const dataExiste =
    nascimento.getFullYear() === ano &&
    nascimento.getMonth() === mes - 1 &&
    nascimento.getDate() === dia;
  if (!dataExiste) return false;

  const limite = new Date();
  limite.setHours(0, 0, 0, 0);
  limite.setFullYear(limite.getFullYear() - 18);
  return nascimento <= limite;
}

function CadastroPage() {
  const navigate = useNavigate();
  const [usuarioType, setUsuarioType] = useState("responsavel");
  const [nome, setNome] = useState("");
  const [login, setLogin] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [sexo, setSexo] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [especializacoes, setEspecializacoes] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [csenha, setCSenha] = useState("");

  const dataLimiteNascimento = new Date();
  dataLimiteNascimento.setFullYear(dataLimiteNascimento.getFullYear() - 18);
  const dataMaximaNascimento = formatarDataParaInput(dataLimiteNascimento);

  async function validarCadastro(event) {
    event.preventDefault();

    // Validação do formulário
    const formulario = document.querySelector("form");
    if (formulario.checkValidity() === false) {
      formulario.reportValidity();
      return;
    }

    // Validação da idade mínima de 18 anos
    if (!nomeCompletoValido(nome)) {
      alert("Informe seu nome completo, com nome e sobrenome.");
      return;
    }

    if (!maiorDeIdade(nascimento)) {
      alert("Você deve ter pelo menos 18 anos para se cadastrar.");
      return;
    }

    // Validação do CPF
    const cpfRegex = /^\d{11}$/;
    if (!cpfRegex.test(cpf)) {
      alert("CPF inválido. O CPF deve conter 11 dígitos numéricos.");
      return;
    }

    // Validação do telefone
    const telefoneRegex = /^\d{10,15}$/;
    if (!telefoneRegex.test(telefone)) {
      alert(
        "Telefone inválido. O telefone deve conter entre 10 e 15 dígitos numéricos.",
      );
      return;
    }

    // Validação do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Email inválido. Por favor, insira um email válido.");
      return;
    }

    // Validação da foto de perfil
    if (
      fotoPerfil &&
      fotoPerfil.type &&
      !fotoPerfil.type.startsWith("image/")
    ) {
      alert(
        "Arquivo de foto de perfil inválido. Por favor, selecione uma imagem.",
      );
      return;
    }

    // Validação da senha
    if (senha !== csenha) {
      alert("As senhas não coincidem. Por favor, verifique e tente novamente.");
      return;
    }
    if (senha.length < 6) {
      alert("Senha inválida. A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    // Armazenar dados no banco
    try {
      const dados = new FormData();
      dados.append("login", login.trim());
      dados.append("senha", senha);
      dados.append("tipo", usuarioType);
      dados.append("nome", nome);
      dados.append("cpf", cpf);
      dados.append("telefone", telefone);
      dados.append("data_nascimento", nascimento);
      dados.append("sexo", sexo);
      dados.append("especializacao", especializacoes);
      dados.append("email", email);
      if (fotoPerfil) {
        dados.append("foto_perfil", fotoPerfil);
      }

      const response = await fetch(import.meta.env.VITE_SERVER + "cadastro", {
        method: "POST",
        body: dados,
      });

      // Se o backend responder com 200 OK, o cadastro deu bom.
      if (response.ok) {
        // Redirecionar para a página de login
        navigate("/login");
        return;
      }

      // Se não for 200, mostra a mensagem de erro retornada pelo backend.
      const errorData = await response.json();
      alert(errorData.error || "Dados inválidos.");
    } catch (err) {
      console.error(err);
      alert("Erro de conexão com o servidor. Tente novamente.");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_80%_15%,_#d1fae5,_transparent_28%),linear-gradient(135deg,_#f8fafc_0%,_#ecfdf5_100%)] px-0 py-0">
      <CabecalhoMarca />
      <main className="flex-1 px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-[32px] border border-white bg-white/95 p-5 shadow-2xl shadow-emerald-950/10 sm:p-8">
        <div className="mb-5">
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Vamos começar?
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Crie seu acesso para organizar o cuidado.
          </p>
        </div>

        <form onSubmit={validarCadastro} className="space-y-5">
          <div>
            <label
              htmlFor="tipo-usuario"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Tipo de usuário
            </label>
            <select
              name="tipo-usuario"
              id="tipo-usuario"
              required
              value={usuarioType}
              onChange={(e) => setUsuarioType(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="responsavel">Responsável</option>
              <option value="cuidador">Cuidador</option>
            </select>
          </div>

          {usuarioType === "responsavel" ? (
            <CadastroResponsavel
              setNome={setNome}
              setLogin={setLogin}
              setNascimento={setNascimento}
              sexo={sexo}
              setSexo={setSexo}
              setCpf={setCpf}
              setTelefone={setTelefone}
              setFotoPerfil={setFotoPerfil}
              setEmail={setEmail}
              setSenha={setSenha}
              setCSenha={setCSenha}
              dataMaximaNascimento={dataMaximaNascimento}
            />
          ) : (
            <CadastroCuidador
              setNome={setNome}
              setLogin={setLogin}
              setNascimento={setNascimento}
              sexo={sexo}
              setSexo={setSexo}
              setCpf={setCpf}
              setTelefone={setTelefone}
              setEspecializacoes={setEspecializacoes}
              setFotoPerfil={setFotoPerfil}
              setEmail={setEmail}
              setSenha={setSenha}
              setCSenha={setCSenha}
              dataMaximaNascimento={dataMaximaNascimento}
            />
          )}

          <button
            type="submit"
            className="w-full rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Concluir cadastro
          </button>
        </form>
      </div>
      </main>
      <CreditoLaboratorio />
    </div>
  );
}

export default CadastroPage;
