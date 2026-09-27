import { useState } from "react";
import BotaoVisual from "./botaoVisual";

function CadastroCuidador({
  setNome,
  setLogin,
  setNascimento,
  sexo,
  setSexo,
  setCpf,
  setTelefone,
  setEspecializacoes,
  setFotoPerfil,
  setEmail,
  setSenha,
  setCSenha,
  dataMaximaNascimento,
}) {
  const [mostrarSenha, setMostrarSenha] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <label
          htmlFor="nome"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Nome completo
        </label>
        <input
          type="text"
          name="nome"
          id="nome"
          required
          minLength="3"
          onChange={(e) => setNome(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          placeholder="Digite seu nome"
        />
      </div>

      <div>
        <label
          htmlFor="login"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Nome de usuário
        </label>
        <input
          type="text"
          name="login"
          id="login"
          required
          minLength="3"
          maxLength="50"
          autoComplete="username"
          onChange={(e) => setLogin(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          placeholder="Escolha seu usuário"
        />
      </div>

      <div>
        <label
          htmlFor="data-de-nascimento"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Data de nascimento
        </label>
        <input
          type="date"
          name="data-de-nascimento"
          id="data-de-nascimento"
          required
          max={dataMaximaNascimento}
          onChange={(e) => setNascimento(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <div>
        <label
          htmlFor="sexo"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Sexo
        </label>
        <select
          name="sexo"
          id="sexo"
          required
          value={sexo}
          onChange={(e) => setSexo(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="" disabled>
            Selecione
          </option>
          <option value="M">Homem</option>
          <option value="F">Mulher</option>
          <option value="Outro">Outro</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="CPF"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          CPF
        </label>
        <input
          type="text"
          name="CPF"
          id="CPF"
          maxLength="11"
          required
          onChange={(e) => setCpf(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          placeholder="Somente números"
        />
      </div>

      <div>
        <label
          htmlFor="numero-telefone"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Telefone
        </label>
        <input
          type="tel"
          name="numero-telefone"
          id="numero-telefone"
          maxLength="15"
          required
          onChange={(e) => setTelefone(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          placeholder="(00) 00000-0000"
        />
      </div>

      <div>
        <label
          htmlFor="especializacoes"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Especializações
        </label>
        <input
          type="text"
          name="especializacoes"
          id="especializacoes"
          required
          onChange={(e) => setEspecializacoes(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          placeholder="Ex.: Enfermagem, geriatria"
        />
      </div>

      <div>
        <label
          htmlFor="emailCuidador"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Email
        </label>
        <input
          type="email"
          name="emailCuidador"
          id="emailCuidador"
          required
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          placeholder="seu@email.com"
        />
      </div>

      <div>
        <label
          htmlFor="foto-perfil"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Foto de perfil:
        </label>
        <input
          type="file"
          accept="image/*"
          name="foto_perfil"
          id="foto-perfil"
          onChange={(e) => setFotoPerfil(e.target.files[0] || null)}
          className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <div>
        <label
          htmlFor="senha"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Senha
        </label>
        <div className="relative">
          <input
            type={mostrarSenha ? "text" : "password"}
            name="csenha"
            id="csenha"
            required
            onChange={(e) => setSenha(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 pr-12 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="Crie uma senha"
          />
          <button
            type="button"
            onClick={() => setMostrarSenha((prev) => !prev)}
            className="absolute inset-y-0 right-3 flex items-center text-lg"
            aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
            title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
          >
            <BotaoVisual ver={mostrarSenha} />
          </button>
        </div>
      </div>

      <div>
        <label
          htmlFor="csenha"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Confirmar Senha
        </label>
        <div className="relative">
          <input
            type={mostrarSenha ? "text" : "password"}
            name="senha"
            id="senha"
            required
            onChange={(e) => setCSenha(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 pr-12 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="Crie uma senha"
          />
          <button
            type="button"
            onClick={() => setMostrarSenha((prev) => !prev)}
            className="absolute inset-y-0 right-3 flex items-center text-lg"
            aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
            title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
          >
            <BotaoVisual ver={mostrarSenha} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default CadastroCuidador;
