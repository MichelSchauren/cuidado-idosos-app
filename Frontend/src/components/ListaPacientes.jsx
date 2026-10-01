import { Phone, ChevronRight, Package, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import FotoPerfil from "./FotoPerfil";

function ListaPacientes({ pacientes }) {
  const estoqueAlerta = true;
  const prescSuspensa = true;

  function calcIdade(nascimento) {
    const data = new Date();
    const nasc = new Date(nascimento);

    let idade = data.getFullYear() - nasc.getFullYear();
    if (
      nasc.getMonth() > data.getMonth() ||
      (nasc.getMonth() === data.getMonth() && nasc.getDate() > data.getDate())
    ) {
      idade -= 1;
    }
    return idade;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-2 px-4 py-5 sm:px-6">
      {(!pacientes || pacientes.length === 0) && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center shadow-sm">
          <p className="text-slate-500">Nenhum paciente encontrado</p>
        </div>
      )}

      {pacientes?.map((paciente) => (
        <Link to={`/paciente/${paciente.id}/perfil`} key={paciente.id}>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:shadow-md sm:p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
              {/* <User className="h-5 w-5 text-emerald-700" /> */}
              <FotoPerfil
                src={paciente.foto}
                alt={paciente.nome}
                size="pequeno"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-semibold text-slate-900">
                  {paciente.nome}
                </h3>
                {estoqueAlerta && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    <Package className="h-3 w-3" /> Estoque baixo
                  </span>
                )}
                {prescSuspensa && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                    <AlertTriangle className="h-3 w-3" /> Med. suspenso
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {calcIdade(paciente.data_nascimento)} anos · CPF {paciente.cpf}
              </p>
              {paciente.telefone && (
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <Phone className="h-3 w-3" /> {paciente.telefone}
                </p>
              )}
            </div>

            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          </div>
        </Link>
      ))}
    </div>
  );
}

export default ListaPacientes;
