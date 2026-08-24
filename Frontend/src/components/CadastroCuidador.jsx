import { useState } from "react";
import BotaoVisual from "./botaoVisual";

function CadastroCuidador({
  setNome,
  setNascimento,
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
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
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

      <div className="grid gap-4 sm:grid-cols-2">
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
            onChange={(e) => setSexo(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="" disabled selected>
              Selecione
            </option>
            <option value="homem">Homem</option>
            <option value="mulher">Mulher</option>
            <option value="indefinido">Indefinido</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
            name="senha"
            id="senha"
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
