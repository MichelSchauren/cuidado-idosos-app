import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CadastroResponsavel from "../components/CadastroResponsavel";
import CadastroCuidador from "../components/CadastroCuidador";

function CadastroPage() {
  const navigate = useNavigate();
  const [usuarioType, setUsuarioType] = useState("responsavel");
  const [nome, setNome] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [sexo, setSexo] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [especializacoes, setEspecializacoes] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [csenha, setCSenha] = useState("");

  const dataAtual = new Date();

  async function validarCadastro(event) {
    event.preventDefault();

    // Validação do formulário
    const formulario = document.querySelector("form");
    if (formulario.checkValidity() === false) {
      formulario.reportValidity();
      return;
    }

    // Validação da idade mínima de 18 anos
    const dataNascimento = new Date(nascimento);
    if (dataAtual.getFullYear() - dataNascimento.getFullYear() < 18) {
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
      dados.append("login", nome);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-emerald-50 px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl sm:p-10">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Cadastro
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Crie sua conta
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Preencha os dados abaixo para começar.
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
              setNascimento={setNascimento}
              setSexo={setSexo}
              setCpf={setCpf}
              setTelefone={setTelefone}
              setFotoPerfil={setFotoPerfil}
              setEmail={setEmail}
              setSenha={setSenha}
              setCSenha={setCSenha}
            />
          ) : (
            <CadastroCuidador
              setNome={setNome}
              setNascimento={setNascimento}
              setSexo={setSexo}
              setCpf={setCpf}
              setTelefone={setTelefone}
              setEspecializacoes={setEspecializacoes}
              setFotoPerfil={setFotoPerfil}
              setEmail={setEmail}
              setSenha={setSenha}
              setCSenha={setCSenha}
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
    </div>
  );
}

export default CadastroPage;
