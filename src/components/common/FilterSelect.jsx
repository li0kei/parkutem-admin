// =====================================================
// FILTER SELECT COMPONENT
// =====================================================

function FilterSelect({ value, onChange, options, label }) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
          {label}
        </label>
      )}

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

export default FilterSelect