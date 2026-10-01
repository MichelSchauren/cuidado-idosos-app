import { User } from "lucide-react";

function FotoPerfil({ src, alt, size }) {
  const tamanho = size === "grande" ? "h-20 w-20" : "h-11 w-11";

  if (!src) {
    return (
      <span
        className={`flex ${tamanho} items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 ring-2 ring-emerald-100 transition group-hover:ring-emerald-300`}
      >
        <User className={size === "grande" ? "h-9 w-9" : "h-5 w-5"} />
      </span>
    );
  }

  return (
    <img
      src={`${import.meta.env.VITE_SERVER.replace(/\/api\/?$/, "")}${src}`}
      alt={alt}
      className={`${tamanho} rounded-xl object-cover ring-2 ring-emerald-100 transition group-hover:ring-emerald-300`}
    />
  );
}

export default FotoPerfil;
