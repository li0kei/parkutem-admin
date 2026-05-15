// =====================================================
// IMPORTS
// =====================================================

import { Search } from "lucide-react"

// =====================================================
// SEARCH INPUT COMPONENT
// =====================================================

function SearchInput({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="relative w-full">
      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
      />
    </div>
  )
}

export default SearchInput