function CampoPerfil({ id, label, children }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      </div>
      {children}
    </div>
  );
}
export default CampoPerfil;
