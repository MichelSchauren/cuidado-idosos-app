function CadastroResponsavel({
  setNome,
  setNascimento,
  setSexo,
  setCpf,
  setTelefone,
  setFotoPerfil,
  setEmail,
  setSenha,
}) {
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
          htmlFor="senha"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Senha
        </label>
        <input
          type="password"
          name="senha"
          id="senha"
          required
          onChange={(e) => setSenha(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          placeholder="Crie uma senha"
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
          name="foto-perfil"
          id="foto-perfil"
          className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>
    </div>
  );
}

export default CadastroResponsavel;
