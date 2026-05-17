// =====================================================
// IMPORTS
// =====================================================

import { Construction } from "lucide-react"

// =====================================================
// PAGE PLACEHOLDER COMPONENT
// =====================================================

function PagePlaceholder({ title, description }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
        <Construction className="h-7 w-7" />
      </div>

      <h1 className="mt-6 text-2xl font-black text-slate-950">{title}</h1>

      <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
        {description}
      </p>

      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
        <p className="text-sm font-bold text-slate-600">
          This module is reserved for future ParkUTeM system expansion.
        </p>
      </div>
    </div>
  )
}

export default PagePlaceholder