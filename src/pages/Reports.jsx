// =====================================================
// IMPORTS
// =====================================================

import { useMemo, useState } from "react"

import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  Download,
  FileText,
  Radio,
  ScanLine,
  Users,
} from "lucide-react"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import StatusBadge from "../components/common/StatusBadge"

import {
  analyticsSummary,
  anprDetectionData,
  conversionData,
  guestStatusReportData,
  liveActivityData,
  liveAlertsData,
  liveParkingFlowData,
  reservationStatusReportData,
  revenueBreakdownReportData,
  revenueTrendData,
  trafficByDayData,
  trafficByMonthData,
  zoneOccupancyReportData,
} from "../data/reportsData"

// =====================================================
// CONSTANTS
// =====================================================

const tabs = ["Overview", "Traffic", "Booking Flow", "Monthly", "Live"]
const viewModes = ["Day", "Week", "Month"]
const COLORS = ["#06b6d4", "#2563eb", "#14b8a6", "#f97316", "#8b5cf6"]

const monthOptions = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
]
const yearOptions = [2025, 2026, 2027]

// =====================================================
// REPORTS / ANALYTICS PAGE
// =====================================================

function Reports() {
    const [activeTab, setActiveTab] = useState("Overview")
    const [viewMode, setViewMode] = useState("Week")
    const [startDate, setStartDate] = useState("2026-05-11")
    const [endDate, setEndDate] = useState("2026-05-17")
    const [selectedMonth, setSelectedMonth] = useState(5)
    const [selectedYear, setSelectedYear] = useState(2026)
    const [compareMonth, setCompareMonth] = useState(4)
    const [compareYear, setCompareYear] = useState(2026)
    const [downloadOpen, setDownloadOpen] = useState(false)

  // =====================================================
  // SELECTED TRAFFIC DATA
  // =====================================================

  const selectedTrafficData = useMemo(() => {
    if (viewMode === "Month") {
      return trafficByMonthData
    }

    return trafficByDayData
  }, [viewMode])

// =====================================================
// MONTHLY ANALYTICS DATA
// =====================================================

const selectedMonthLabel = useMemo(() => {
  return (
    monthOptions.find((month) => month.value === Number(selectedMonth))?.label ||
    "May"
  )
}, [selectedMonth])

const compareMonthLabel = useMemo(() => {
  return (
    monthOptions.find((month) => month.value === Number(compareMonth))?.label ||
    "April"
  )
}, [compareMonth])

const monthlySummary = useMemo(() => {
  const monthNumber = Number(selectedMonth)
  const yearFactor = Number(selectedYear) - 2025

  return {
    totalVehicles: 7200 + monthNumber * 820 + yearFactor * 420,
    averageOccupancy: `${Math.min(92, 54 + monthNumber * 3)}%`,
    totalRevenue: Number((680 + monthNumber * 118 + yearFactor * 80).toFixed(2)),
    reservations: 110 + monthNumber * 26 + yearFactor * 12,
    guestBookings: 38 + monthNumber * 9 + yearFactor * 6,
    anprAccuracy: `${Math.min(99.2, 94 + monthNumber * 0.38).toFixed(1)}%`,
    flaggedDetections: 8 + monthNumber * 2,
    activeIssues: Math.max(3, 16 - monthNumber + yearFactor),
  }
}, [selectedMonth, selectedYear])

const compareSummary = useMemo(() => {
  const monthNumber = Number(compareMonth)
  const yearFactor = Number(compareYear) - 2025

  return {
    totalVehicles: 7200 + monthNumber * 820 + yearFactor * 420,
    averageOccupancy: `${Math.min(92, 54 + monthNumber * 3)}%`,
    totalRevenue: Number((680 + monthNumber * 118 + yearFactor * 80).toFixed(2)),
    reservations: 110 + monthNumber * 26 + yearFactor * 12,
    guestBookings: 38 + monthNumber * 9 + yearFactor * 6,
    anprAccuracy: `${Math.min(99.2, 94 + monthNumber * 0.38).toFixed(1)}%`,
    flaggedDetections: 8 + monthNumber * 2,
    activeIssues: Math.max(3, 16 - monthNumber + yearFactor),
  }
}, [compareMonth, compareYear])

const monthlyTrafficData = useMemo(() => {
  const monthNumber = Number(selectedMonth)

  return [
    {
      label: "Week 1",
      entries: 1800 + monthNumber * 80,
      exits: 1720 + monthNumber * 72,
      occupancy: 58 + monthNumber * 2,
    },
    {
      label: "Week 2",
      entries: 2050 + monthNumber * 92,
      exits: 1980 + monthNumber * 85,
      occupancy: 62 + monthNumber * 2,
    },
    {
      label: "Week 3",
      entries: 2280 + monthNumber * 96,
      exits: 2160 + monthNumber * 90,
      occupancy: 66 + monthNumber * 2,
    },
    {
      label: "Week 4",
      entries: 2450 + monthNumber * 104,
      exits: 2380 + monthNumber * 96,
      occupancy: 70 + monthNumber * 2,
    },
  ]
}, [selectedMonth])

const monthlyRevenueData = useMemo(() => {
  const monthNumber = Number(selectedMonth)

  return [
    {
      label: "Week 1",
      reservation: 140 + monthNumber * 10,
      parking: 90 + monthNumber * 8,
      guest: 80 + monthNumber * 7,
      refund: 5,
    },
    {
      label: "Week 2",
      reservation: 170 + monthNumber * 12,
      parking: 115 + monthNumber * 10,
      guest: 95 + monthNumber * 8,
      refund: 0,
    },
    {
      label: "Week 3",
      reservation: 190 + monthNumber * 13,
      parking: 135 + monthNumber * 11,
      guest: 120 + monthNumber * 9,
      refund: 10,
    },
    {
      label: "Week 4",
      reservation: 210 + monthNumber * 14,
      parking: 155 + monthNumber * 12,
      guest: 140 + monthNumber * 10,
      refund: 5,
    },
  ]
}, [selectedMonth])

// =====================================================
// CURRENT SUMMARY BASED ON ACTIVE TAB
// =====================================================

const currentSummary = activeTab === "Monthly" ? monthlySummary : analyticsSummary

// =====================================================
// MONTHLY COMPARISON DATA
// =====================================================

const monthlyComparisonChartData = useMemo(() => {
  return [
    {
      metric: "Vehicles",
      current: monthlySummary.totalVehicles,
      compare: compareSummary.totalVehicles,
    },
    {
      metric: "Revenue",
      current: monthlySummary.totalRevenue,
      compare: compareSummary.totalRevenue,
    },
    {
      metric: "Reservations",
      current: monthlySummary.reservations,
      compare: compareSummary.reservations,
    },
    {
      metric: "Guests",
      current: monthlySummary.guestBookings,
      compare: compareSummary.guestBookings,
    },
  ]
}, [monthlySummary, compareSummary])

  // =====================================================
  // DOWNLOAD HANDLER
  // =====================================================

  function handleDownload(format) {
    setDownloadOpen(false)

    if (format === "CSV") {
      const rows = [
        ["Metric", "Value"],
        ["Total Vehicles", analyticsSummary.totalVehicles],
        ["Average Occupancy", analyticsSummary.averageOccupancy],
        ["Total Revenue", `RM ${analyticsSummary.totalRevenue}`],
        ["Reservations", analyticsSummary.reservations],
        ["Guest Bookings", analyticsSummary.guestBookings],
        ["ANPR Accuracy", analyticsSummary.anprAccuracy],
        ["Flagged Detections", analyticsSummary.flaggedDetections],
      ]

      const csvContent = rows.map((row) => row.join(",")).join("\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = `parkutem-report-${startDate}-to-${endDate}.csv`
      link.click()

      URL.revokeObjectURL(url)
      return
    }

    alert(`${format} export is a frontend placeholder for now.`)
  }

  return (
    <div className="space-y-6">
      {/* =====================================================
          ANALYTICS CONTROL BAR
          ===================================================== */}

   <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
  <div className="flex items-center justify-between gap-3 overflow-visible pb-1">
    {/* =====================================================
        TAB BUTTONS
        ===================================================== */}

    <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => setActiveTab(tab)}
          className={`shrink-0 rounded-2xl px-4 py-3 text-sm font-black transition ${
            activeTab === tab
              ? "bg-slate-950 text-white shadow-sm"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>

    {/* =====================================================
        RIGHT CONTROLS
        ===================================================== */}

    <div className="flex shrink-0 items-center gap-2">
   {activeTab === "Monthly" && (
  <>
    <select
      value={selectedMonth}
      onChange={(event) => setSelectedMonth(Number(event.target.value))}
      className="h-12 w-[110px] rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
    >
      {monthOptions.map((month) => (
        <option key={month.value} value={month.value}>
          {month.label}
        </option>
      ))}
    </select>

    <select
      value={selectedYear}
      onChange={(event) => setSelectedYear(Number(event.target.value))}
      className="h-12 w-[90px] rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
    >
      {yearOptions.map((year) => (
        <option key={year} value={year}>
          {year}
        </option>
      ))}
    </select>
  </>
)}

      {activeTab !== "Live" && activeTab !== "Monthly" && (
        <>
          <DateInput value={startDate} onChange={setStartDate} />
          <DateInput value={endDate} onChange={setEndDate} />

          <div className="flex h-12 shrink-0 rounded-2xl bg-slate-100 p-1">
            {viewModes.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`rounded-xl px-4 text-sm font-black transition ${
                  viewMode === mode
                    ? "bg-cyan-300 text-slate-950"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="relative z-50 shrink-0">
       <button
  type="button"
  onClick={() => setDownloadOpen((prev) => !prev)}
  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white transition hover:bg-slate-800"
  aria-label="Download report"
  title="Download report"
>
  <Download className="h-5 w-5" />
</button>

        {downloadOpen && (
  <div className="absolute right-0 top-full z-[999] mt-2 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/5">
    {["CSV", "Excel (.xlsx)", "PDF"].map((format) => (
      <button
        key={format}
        type="button"
        onClick={() => handleDownload(format)}
        className="block w-full bg-white px-5 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700"
      >
        {format}
      </button>
    ))}
  </div>
)}

      </div>
    </div>
  </div>

  {/* =====================================================
      PERIOD LABEL
      ===================================================== */}

  {activeTab === "Monthly" && (
    <p className="mt-4 text-sm font-semibold text-slate-500">
      Month: {selectedMonthLabel} {selectedYear}
    </p>
  )}

  {activeTab === "Live" && (
    <p className="mt-4 text-sm font-semibold text-slate-500">
      Live monitoring mode • Today:{" "}
      {new Date().toLocaleDateString("en-MY", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}
    </p>
  )}

  {activeTab !== "Monthly" && activeTab !== "Live" && (
    <p className="mt-4 text-sm font-semibold text-slate-500">
      {viewMode}: {startDate} → {endDate}
    </p>
  )}
</section>

   {/* =====================================================
    SUMMARY PANEL
    ===================================================== */}

{activeTab !== "Live" && (
  <section className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 shadow-sm">
        <div className="relative p-4 sm:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.14),transparent_35%)]" />
          <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:34px_34px]" />

          <div className="relative z-10 mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                ParkUTeM Analytics
              </p>

              <h2 className="mt-2 text-xl font-black leading-tight text-white sm:text-2xl">
                Reports & System Performance
              </h2>
            </div>

            <p className="hidden max-w-xl text-sm leading-6 text-slate-300 sm:block">
              Analyse occupancy, revenue, reservations, guest parking, ANPR
              detections, and live parking operations.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
            <SummaryCard
              label="Vehicles"
              value={currentSummary.totalVehicles}
              icon={Activity}
              className="bg-cyan-300/10 text-cyan-300"
            />

            <SummaryCard
              label="Occupancy"
              value={currentSummary.averageOccupancy}
              icon={BarChart3}
              className="bg-blue-300/10 text-blue-300"
            />

            <SummaryCard
              label="Revenue"
              value={`RM ${currentSummary.totalRevenue}`}
              icon={CircleDollarSign}
              className="bg-emerald-300/10 text-emerald-300"
            />

            <SummaryCard
              label="Reservations"
              value={currentSummary.reservations}
              icon={CalendarDays}
              className="bg-amber-300/10 text-amber-300"
            />

            <SummaryCard
              label="Guests"
              value={currentSummary.guestBookings}
              icon={Users}
              className="bg-violet-300/10 text-violet-300"
            />

            <SummaryCard
              label="ANPR"
              value={currentSummary.anprAccuracy}
              icon={ScanLine}
              className="bg-teal-300/10 text-teal-300"
            />

            <SummaryCard
              label="Flagged"
              value={currentSummary.flaggedDetections}
              icon={Radio}
              className="bg-red-300/10 text-red-300"
            />

            <SummaryCard
              label="Issues"
              value={currentSummary.activeIssues}
              icon={FileText}
              className="bg-orange-300/10 text-orange-300"
            />
          </div>
        </div>
      </section>
      )}

      {/* =====================================================
          TAB CONTENT
          ===================================================== */}

      {activeTab === "Overview" && (
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <TrafficChart data={selectedTrafficData} />
          <RevenueBreakdownChart />
          <RevenueTrendChart />
          <LiveActivityPanel />
        </div>
      )}

      {activeTab === "Traffic" && (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <TrafficChart data={selectedTrafficData} />
          <ZoneOccupancyChart />
          <ANPRDetectionChart />
        </div>
      )}

      {activeTab === "Booking Flow" && (
  <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
    <BookingFlowChart />
    <ReservationStatusChart />
    <GuestStatusChart />
  </div>
)}

    {activeTab === "Monthly" && (
  <div className="space-y-6">
    <div className="grid gap-6 xl:grid-cols-2">
      <TrafficChart
        data={monthlyTrafficData}
        title={`${selectedMonthLabel} ${selectedYear} Traffic Analytics`}
      />

      <RevenueTrendChart
        title={`${selectedMonthLabel} ${selectedYear} Revenue Trend`}
        data={monthlyRevenueData}
      />
    </div>

    <div className="grid gap-6 xl:grid-cols-2">
      <ZoneOccupancyChart />

      <MonthlyComparisonBarChart
  selectedMonthLabel={selectedMonthLabel}
  selectedYear={selectedYear}
  compareMonth={compareMonth}
  compareYear={compareYear}
  compareMonthLabel={compareMonthLabel}
  setCompareMonth={setCompareMonth}
  setCompareYear={setCompareYear}
  data={monthlyComparisonChartData}
/>
    </div>
  </div>
)}

   {activeTab === "Live" && (
  <div className="space-y-6">
    {/* =====================================================
        LIVE TOP SECTION
        ===================================================== */}

    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <LiveParkingFlowChart />
      </div>

      <div className="lg:col-span-2">
        <LiveStatusPanel />
      </div>
    </div>

    {/* =====================================================
        LIVE ACTIVITY + ALERTS
        ===================================================== */}

    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <LiveActivityPanel expanded />
      </div>

      <div className="lg:col-span-2">
        <LiveAlertsPanel />
      </div>
    </div>
  </div>
)}

    </div>
  )
}


// =====================================================
// DATE INPUT
// =====================================================

function DateInput({ value, onChange }) {
  return (
    <div className="relative">
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-[145px] rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
      />
    </div>
  )
}

// =====================================================
// SUMMARY CARD
// =====================================================

function SummaryCard({ label, value, icon: Icon, className }) {
  return (
    <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.06] p-4 shadow-sm backdrop-blur">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl ${className}`}>
        <Icon className="h-5 w-5" />
      </div>

      <p className="text-lg font-black text-white">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-300">{label}</p>
    </div>
  )
}

// =====================================================
// TRAFFIC CHART
// =====================================================

function TrafficChart({ data, title = "Traffic & Occupancy Analytics" }) {
  return (
    <ChartCard title={title} subtitle="Vehicle entry, exit, and occupancy trend.">
      <ResponsiveContainer width="100%" height={330}>
        <LineChart data={data} margin={{ top: 12, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="entries" name="Entries" stroke="#06b6d4" strokeWidth={3} />
          <Line type="monotone" dataKey="exits" name="Exits" stroke="#2563eb" strokeWidth={3} />
          <Line type="monotone" dataKey="occupancy" name="Occupancy %" stroke="#14b8a6" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// =====================================================
// REVENUE TREND CHART
// =====================================================

function RevenueTrendChart({
  title = "Revenue Trend",
  data = revenueTrendData,
}) {
  return (
    <ChartCard title={title} subtitle="Reservation, parking, guest payment, and refund trend.">
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data} margin={{ top: 12, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip />
          <Legend />
          <Area type="monotone" dataKey="reservation" name="Reservation Fee" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.18} />
          <Area type="monotone" dataKey="parking" name="After 7PM Parking" stroke="#2563eb" fill="#2563eb" fillOpacity={0.15} />
          <Area type="monotone" dataKey="guest" name="Guest Parking" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.16} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// =====================================================
// REVENUE BREAKDOWN CHART
// =====================================================

function RevenueBreakdownChart() {
  return (
    <ChartCard title="Revenue Breakdown" subtitle="Revenue grouped by payment category.">
      <ResponsiveContainer width="100%" height={330}>
        <PieChart>
          <Tooltip formatter={(value) => `RM ${value}`} />
          <Legend />
          <Pie
            data={revenueBreakdownReportData}
            dataKey="value"
            nameKey="name"
            innerRadius={70}
            outerRadius={105}
            paddingAngle={4}
          >
            {revenueBreakdownReportData.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// =====================================================
// ZONE OCCUPANCY CHART
// =====================================================

function ZoneOccupancyChart() {
  return (
    <ChartCard title="Occupancy by Zone" subtitle="Occupied and available bay distribution.">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={zoneOccupancyReportData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="zone" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="occupied" name="Occupied" fill="#2563eb" radius={[12, 12, 0, 0]} />
          <Bar dataKey="available" name="Available" fill="#06b6d4" radius={[12, 12, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// =====================================================
// ANPR DETECTION CHART
// =====================================================

function ANPRDetectionChart() {
  return (
    <ChartCard title="ANPR Detection Report" subtitle="Approved, flagged, and unknown detections.">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={anprDetectionData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="approved" name="Approved" fill="#14b8a6" radius={[12, 12, 0, 0]} />
          <Bar dataKey="flagged" name="Flagged" fill="#f97316" radius={[12, 12, 0, 0]} />
          <Bar dataKey="unknown" name="Unknown" fill="#64748b" radius={[12, 12, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// =====================================================
// Booking Flow CHART
// =====================================================

function BookingFlowChart() {
  return (
    <ChartCard title="Booking Conversion Funnel" subtitle="Guest booking and reservation conversion behaviour.">
      <ResponsiveContainer width="100%" height={330}>
        <BarChart data={conversionData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="guest" name="Guest Booking" fill="#06b6d4" radius={[12, 12, 0, 0]} />
          <Bar dataKey="reservation" name="Student/Staff Reservation" fill="#2563eb" radius={[12, 12, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// =====================================================
// STATUS PIE CHARTS
// =====================================================

function ReservationStatusChart() {
  return (
    <PieReportCard
      title="Reservation Status"
      subtitle="Upcoming, active, completed, and cancelled reservations."
      data={reservationStatusReportData}
    />
  )
}

function GuestStatusChart() {
  return (
    <PieReportCard
      title="Guest Booking Status"
      subtitle="Guest booking status distribution."
      data={guestStatusReportData}
    />
  )
}

function PieReportCard({ title, subtitle, data }) {
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Tooltip />
          <Legend />
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={105}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// =====================================================
// MONTHLY COMPARISON BAR CHART
// =====================================================

function MonthlyComparisonBarChart({
  selectedMonthLabel,
  selectedYear,
  compareMonth,
  compareYear,
  compareMonthLabel,
  setCompareMonth,
  setCompareYear,
  data,
}) {
  const currentLabel = `${selectedMonthLabel} ${selectedYear}`
  const compareLabel = `${compareMonthLabel} ${compareYear}`

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <h3 className="text-lg font-black text-slate-950">
            Monthly Comparison
          </h3>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Compare {currentLabel} with another month.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-sm font-black text-slate-400 sm:inline">
            vs
          </span>

          <select
            value={compareMonth}
            onChange={(event) => setCompareMonth(Number(event.target.value))}
            className="h-11 w-[120px] rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
          >
            {monthOptions.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>

          <select
            value={compareYear}
            onChange={(event) => setCompareYear(Number(event.target.value))}
            className="h-11 w-[90px] rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="metric" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip />
          <Legend />

          <Bar
            dataKey="current"
            name={currentLabel}
            fill="#06b6d4"
            radius={[12, 12, 0, 0]}
          />

          <Bar
            dataKey="compare"
            name={compareLabel}
            fill="#2563eb"
            radius={[12, 12, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// =====================================================
// LIVE PARKING FLOW CHART
// =====================================================

function LiveParkingFlowChart() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 p-6 shadow-sm">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
            Live Graph
          </p>

          <h3 className="mt-3 text-2xl font-black text-white">
            Real-Time Vehicle Flow
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Live placeholder graph for vehicle entries, exits, and active
            parking sessions.
          </p>
        </div>

        <span className="w-fit rounded-full bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-300">
          Updating Live
        </span>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={liveParkingFlowData}
            margin={{ top: 12, right: 20, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="liveEntries" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>

              <linearGradient id="liveActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />

            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              stroke="#94a3b8"
              tick={{ fontSize: 12 }}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              stroke="#94a3b8"
              tick={{ fontSize: 12 }}
            />

            <Tooltip
              contentStyle={{
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                fontWeight: 700,
              }}
            />

            <Legend />

            <Area
              type="monotone"
              dataKey="active"
              name="Active Sessions"
              stroke="#14b8a6"
              fill="url(#liveActive)"
              strokeWidth={3}
            />

            <Area
              type="monotone"
              dataKey="entries"
              name="Entries"
              stroke="#06b6d4"
              fill="url(#liveEntries)"
              strokeWidth={3}
            />

            <Line
              type="monotone"
              dataKey="exits"
              name="Exits"
              stroke="#60a5fa"
              strokeWidth={3}
              dot={{ r: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// =====================================================
// LIVE STATUS PANEL
// =====================================================

function LiveStatusPanel() {
  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
        Live System
      </p>

      <h3 className="mt-3 text-2xl font-black text-white">
        Current Operations
      </h3>

      <div className="mt-6 grid gap-4">
        <LiveMetric label="ANPR Cameras" value="8 / 8 Online" />
        <LiveMetric label="Active Parking Sessions" value="39 Vehicles" />
        <LiveMetric label="Guest ANPR Access" value="16 Enabled" />
        <LiveMetric label="Sensor Health" value="94% Online" />
        <LiveMetric label="Pending Issues" value="9 Tickets" />
      </div>
    </div>
  )
}

function LiveMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
      <p className="text-sm font-bold text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-black text-cyan-300">{value}</p>
    </div>
  )
}

// =====================================================
// LIVE ALERTS PANEL
// =====================================================

function LiveAlertsPanel() {
  return (
    <div className="rounded-[2rem] border border-red-100 bg-white/90 p-6 shadow-sm backdrop-blur">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-500">
            Live Alerts
          </p>

          <h3 className="mt-2 text-lg font-black text-slate-950">
            Attention Required
          </h3>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Issues that may require admin review.
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertTriangle className="h-5 w-5" />
        </div>
      </div>

      <div className="space-y-3">
        {liveAlertsData.map((alert) => (
          <div
            key={alert.id}
            className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-900">
                  {alert.title}
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {alert.description}
                </p>

                <p className="mt-2 text-xs font-semibold text-slate-400">
                  {alert.time} • {alert.category}
                </p>
              </div>

              <StatusBadge status={alert.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// =====================================================
// LIVE ACTIVITY PANEL
// =====================================================

function LiveActivityPanel({ expanded = false }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-950">
            Live Activity
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Latest ANPR, payment, guest, and reservation events.
          </p>
        </div>

        <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
          Live
        </span>
      </div>

      <div className={`space-y-4 ${expanded ? "" : "max-h-[360px] overflow-y-auto pr-1"}`}>
        {liveActivityData.map((activity) => (
          <div
            key={activity.id}
            className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-800">
                  {activity.title}
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {activity.description}
                </p>

                <p className="mt-2 text-xs font-semibold text-slate-400">
                  {activity.time} • {activity.type}
                </p>
              </div>

              <StatusBadge status={activity.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// =====================================================
// CHART CARD
// =====================================================

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
      <div className="mb-6">
        <h3 className="text-lg font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
      </div>

      {children}
    </div>
  )
}

export default Reports