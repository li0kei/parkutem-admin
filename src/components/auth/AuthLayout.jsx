// =====================================================
// IMPORTS
// =====================================================

import { Car, ShieldCheck, Sparkles } from "lucide-react"

// =====================================================
// AUTH LAYOUT
// =====================================================

function AuthLayout({ title, subtitle, children }) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#030816] text-white lg:h-screen lg:overflow-hidden">
      <section className="relative flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 lg:h-screen lg:px-5 lg:py-4">
        {/* =====================================================
            BACKGROUND EFFECTS
            ===================================================== */}

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.2),transparent_32%)]" />

        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:42px_42px]" />

        <div className="absolute left-[-12rem] top-[-12rem] h-[30rem] w-[30rem] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-[-14rem] right-[-10rem] h-[32rem] w-[32rem] rounded-full bg-sky-500/10 blur-3xl" />

        {/* =====================================================
            MAIN CONTENT
            ===================================================== */}

        <div className="relative z-10 grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          {/* =====================================================
              LEFT HERO PANEL - DESKTOP ONLY
              ===================================================== */}

          <div className="hidden lg:block">
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2.5 text-sm font-black text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.08)] backdrop-blur">
              <Sparkles className="h-4 w-4" />
              ANPR-Based Smart Campus Parking
            </div>

            <div className="flex items-center gap-6">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.6rem] border border-cyan-300/20 bg-black shadow-[0_0_35px_rgba(34,211,238,0.16)]">
                <img
                  src="/parkutem-logo.jpeg"
                  alt="ParkUTeM Logo"
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.45em] text-cyan-300">
                  Admin Portal
                </p>

                <h1 className="mt-2 text-5xl font-black leading-none tracking-tight xl:text-6xl">
                  Park<span className="text-cyan-300">UTeM</span>
                </h1>
              </div>
            </div>

            <h2 className="mt-8 max-w-3xl text-4xl font-black leading-tight tracking-tight xl:text-5xl">
              Parking Control,
              <br />
              Made Smarter.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
              Monitor ANPR access, guest bookings, parking bays, vehicle
              stickers, reservations, payments, and support issues from one
              clean admin dashboard.
            </p>

            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-4">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-300">
                  <Car className="h-5 w-5" />
                </div>

                <h3 className="text-sm font-black text-white">Vehicles</h3>
                <p className="mt-1 text-xs text-slate-400">Plate records</p>
              </div>

              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-300">
                  <ShieldCheck className="h-5 w-5" />
                </div>

                <h3 className="text-sm font-black text-white">ANPR</h3>
                <p className="mt-1 text-xs text-slate-400">Access logs</p>
              </div>

              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-300">
                  <Sparkles className="h-5 w-5" />
                </div>

                <h3 className="text-sm font-black text-white">Smart</h3>
                <p className="mt-1 text-xs text-slate-400">Live status</p>
              </div>
            </div>
          </div>

          {/* =====================================================
              FORM PANEL
              ===================================================== */}

          <div className="mx-auto w-full max-w-[27rem] lg:max-w-md">
            {/* =====================================================
                MOBILE BRAND HEADER
                ===================================================== */}

            <div className="mb-5 flex items-center justify-center gap-4 lg:hidden">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-cyan-300/20 bg-black shadow-[0_0_28px_rgba(34,211,238,0.16)]">
                <img
                  src="/parkutem-logo.jpeg"
                  alt="ParkUTeM Logo"
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <p className="text-[0.65rem] font-black uppercase tracking-[0.35em] text-cyan-300">
                  Admin Portal
                </p>

                <h1 className="mt-1 text-2xl font-black leading-none">
                  Park<span className="text-cyan-300">UTeM</span>
                </h1>
              </div>
            </div>

            {/* =====================================================
                LOGIN CARD
                ===================================================== */}

            <div className="rounded-[1.8rem] border border-white/10 bg-slate-900/85 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-7 lg:rounded-[2rem]">
              <p className="mb-4 text-xs font-black uppercase tracking-[0.42em] text-cyan-300">
                ParkUTeM Portal
              </p>

              <h2 className="text-3xl font-black tracking-tight text-white sm:text-3xl">
                {title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                {subtitle}
              </p>

              <div className="mt-6">{children}</div>
            </div>

            <p className="mt-4 text-center text-xs font-semibold text-slate-500">
              © 2026 ParkUTeM Admin Prototype.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

export default AuthLayout