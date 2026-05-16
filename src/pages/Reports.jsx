// =====================================================
// IMPORTS
// =====================================================

import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarCheck,
  CalendarDays,
  Car,
  ChevronDown,
  Download,
  LifeBuoy,
  Radio,
  RefreshCw,
  ScanLine,
  TrendingUp,
  Wallet,
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

import { emptyReportsData } from "../data/reportsData"

import {
  loadAdminReportsData,
  subscribeToReportsData,
  unsubscribeFromReportsData,
} from "../services/adminReportsService"

// =====================================================
// CONSTANTS
// =====================================================

const tabs = ["Overview", "Traffic", "Booking Flow", "Monthly", "Live"]

const months = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
]

const years = ["2025", "2026", "2027"]

const chartColors = [
  "#06b6d4",
  "#2563eb",
  "#14b8a6",
  "#f97316",
  "#8b5cf6",
  "#ef4444",
]

// =====================================================
// REPORTS PAGE
// =====================================================

function Reports() {
  const currentYear = new Date().getFullYear().toString()
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0")

  const [activeTab, setActiveTab] = useState("Overview")
  const [trafficView, setTrafficView] = useState("Daily")
  const [downloadOpen, setDownloadOpen] = useState(false)

  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [compareMonth, setCompareMonth] = useState(
    currentMonth === "01"
      ? "12"
      : String(Number(currentMonth) - 1).padStart(2, "0")
  )
  const [compareYear, setCompareYear] = useState(
    currentMonth === "01" ? String(Number(currentYear) - 1) : currentYear
  )

  const [reportsData, setReportsData] = useState(emptyReportsData)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  const {
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
    monthlySummary,
    compareSummary,
    monthlyTrafficData,
    monthlyRevenueData,
    monthlyComparisonChartData,
  } = reportsData

  // =====================================================
  // DERIVED DATA
  // =====================================================

  const selectedTrafficData = useMemo(() => {
    return trafficView === "Monthly" ? trafficByMonthData : trafficByDayData
  }, [trafficView, trafficByDayData, trafficByMonthData])

  const selectedMonthLabel = useMemo(() => {
    const month = months.find((item) => item.value === selectedMonth)
    return month?.label || "Month"
  }, [selectedMonth])

  const compareMonthLabel = useMemo(() => {
    const month = months.find((item) => item.value === compareMonth)
    return month?.label || "Month"
  }, [compareMonth])

  const currentSummary =
    activeTab === "Monthly" ? monthlySummary : analyticsSummary

  // =====================================================
  // LOAD REPORTS DATA FROM SUPABASE
  // =====================================================

  async function loadReportsData() {
    setIsLoading(true)
    setLoadError("")

    try {
      const realReportsData = await loadAdminReportsData({
        startDate,
        endDate,
        selectedMonth,
        selectedYear,
        compareMonth,
        compareYear,
      })

      setReportsData(realReportsData)
    } catch (error) {
      console.error("Failed to load reports data:", error)

      setLoadError(
        error.message || "Unable to load reports data from Supabase."
      )

      setReportsData(emptyReportsData)
    } finally {
      setIsLoading(false)
    }
  }

  // =====================================================
  // INITIAL LOAD + REALTIME SUBSCRIPTION
  // =====================================================

  useEffect(() => {
    loadReportsData()

    const channel = subscribeToReportsData(() => {
      loadReportsData()
    })

    return () => {
      unsubscribeFromReportsData(channel)
    }
  }, [
    startDate,
    endDate,
    selectedMonth,
    selectedYear,
    compareMonth,
    compareYear,
  ])

  // =====================================================
  // DOWNLOAD REPORT
  // =====================================================

  function handleDownloadReport(format) {
    setDownloadOpen(false)

    const rows = [
      ["Metric", "Value"],
      ["Total Vehicles", currentSummary.totalVehicles],
      ["Average Occupancy", currentSummary.averageOccupancy],
      ["Total Revenue", `RM ${formatMoney(currentSummary.totalRevenue)}`],
      ["Reservations", currentSummary.reservations],
      ["Guest Bookings", currentSummary.guestBookings],
      ["ANPR Accuracy", currentSummary.anprAccuracy],
      ["Flagged Detections", currentSummary.flaggedDetections],
      ["Active Issues", currentSummary.activeIssues],
    ]

    const csv = rows.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = `parkutem-${activeTab.toLowerCase()}-report.${format}`
    link.click()

    URL.revokeObjectURL(url)
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-6">
      {/* =====================================================
          LOAD STATUS
          ===================================================== */}

      {loadError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          {loadError}
        </div>
      )}

      {isLoading && (
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-700">
          Loading analytics data from Supabase...
        </div>
      )}

      {/* =====================================================
          HERO PANEL
          ===================================================== */}

      <section className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 shadow-sm">
        <div className="relative p-5 sm:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.16),transparent_35%)]" />
          <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:34px_34px]" />

          <div className="relative z-10 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
                Reports & Analytics
              </p>

              <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
                ParkUTeM Operational Analytics
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                Analyse guest bookings, payments, reservations, ANPR detections,
                parking bays, vehicles, users, and support issues using live
                Supabase data.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={loadReportsData}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-white transition hover:bg-white/[0.1]"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDownloadOpen((value) => !value)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300 sm:w-auto"
                >
                  <Download className="h-4 w-4" />
                  Download
                  <ChevronDown className="h-4 w-4" />
                </button>

                {downloadOpen && (
                  <div className="absolute right-0 top-14 z-20 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                    <button
                      type="button"
                      onClick={() => handleDownloadReport("csv")}
                      className="block w-full px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Export CSV
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadReport("txt")}
                      className="block w-full px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Export TXT
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <HeroMiniStat
              label="Revenue"
              value={`RM ${formatMoney(currentSummary.totalRevenue)}`}
            />
            <HeroMiniStat
              label="ANPR Accuracy"
              value={currentSummary.anprAccuracy}
            />
            <HeroMiniStat
              label="Guest Bookings"
              value={currentSummary.guestBookings}
            />
            <HeroMiniStat
              label="Active Issues"
              value={currentSummary.activeIssues}
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          FILTERS
          ===================================================== */}

      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <DateInput
            label="Start Date"
            value={startDate}
            onChange={setStartDate}
          />

          <DateInput label="End Date" value={endDate} onChange={setEndDate} />

          <button
            type="button"
            onClick={() => {
              setStartDate("")
              setEndDate("")
            }}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100"
          >
            Reset Date
          </button>
        </div>
      </section>

      {/* =====================================================
          TAB NAVIGATION
          ===================================================== */}

      <section className="overflow-x-auto rounded-[2rem] border border-slate-200 bg-white/90 p-2 shadow-sm">
        <div className="flex min-w-max gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-2xl px-5 py-3 text-sm font-black transition ${
                activeTab === tab
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      {/* =====================================================
          SUMMARY CARDS
          ===================================================== */}

      <SummaryGrid summary={currentSummary} />

      {/* =====================================================
          TAB CONTENT
          ===================================================== */}

      {activeTab === "Overview" && (
        <div className="space-y-6">
          <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <RevenueTrendChart data={revenueTrendData} />
            <RevenueBreakdownChart data={revenueBreakdownReportData} />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <ZoneOccupancyChart data={zoneOccupancyReportData} />
            <AnprDetectionChart data={anprDetectionData} />
          </section>
        </div>
      )}

      {activeTab === "Traffic" && (
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-lg font-black text-slate-950">
                  Traffic View
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Switch between daily and monthly ANPR traffic.
                </p>
              </div>

              <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                {["Daily", "Monthly"].map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setTrafficView(view)}
                    className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                      trafficView === view
                        ? "bg-white text-cyan-700 shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    {view}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <TrafficChart data={selectedTrafficData} title={`${trafficView} Traffic`} />

          <section className="grid gap-6 xl:grid-cols-2">
            <ZoneOccupancyChart data={zoneOccupancyReportData} />
            <AnprDetectionChart data={anprDetectionData} />
          </section>
        </div>
      )}

      {activeTab === "Booking Flow" && (
        <div className="space-y-6">
          <BookingFlowChart data={conversionData} />

          <section className="grid gap-6 xl:grid-cols-2">
            <StatusPieChart
              title="Reservation Status"
              subtitle="Reservation status distribution."
              data={reservationStatusReportData}
            />

            <StatusPieChart
              title="Guest Booking Status"
              subtitle="Guest booking status distribution."
              data={guestStatusReportData}
            />
          </section>
        </div>
      )}

      {activeTab === "Monthly" && (
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-4">
              <SelectInput
                label="Current Month"
                value={selectedMonth}
                onChange={setSelectedMonth}
                options={months}
              />

              <SelectInput
                label="Current Year"
                value={selectedYear}
                onChange={setSelectedYear}
                options={years.map((year) => ({
                  value: year,
                  label: year,
                }))}
              />

              <SelectInput
                label="Compare Month"
                value={compareMonth}
                onChange={setCompareMonth}
                options={months}
              />

              <SelectInput
                label="Compare Year"
                value={compareYear}
                onChange={setCompareYear}
                options={years.map((year) => ({
                  value: year,
                  label: year,
                }))}
              />
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <MonthlyComparisonChart
              data={monthlyComparisonChartData}
              currentLabel={`${selectedMonthLabel} ${selectedYear}`}
              compareLabel={`${compareMonthLabel} ${compareYear}`}
            />

            <RevenueTrendChart
              data={monthlyRevenueData}
              title={`${selectedMonthLabel} Revenue Trend`}
            />
          </section>

          <TrafficChart
            data={monthlyTrafficData}
            title={`${selectedMonthLabel} Traffic`}
          />

          <section className="grid gap-6 xl:grid-cols-2">
            <MonthlySummaryCard
              title={`${selectedMonthLabel} ${selectedYear}`}
              summary={monthlySummary}
            />

            <MonthlySummaryCard
              title={`${compareMonthLabel} ${compareYear}`}
              summary={compareSummary}
            />
          </section>
        </div>
      )}

      {activeTab === "Live" && (
        <div className="space-y-6">
          <LiveParkingFlowChart data={liveParkingFlowData} />

          <section className="grid gap-6 xl:grid-cols-2">
            <LiveActivityPanel data={liveActivityData} />
            <LiveAlertsPanel data={liveAlertsData} />
          </section>
        </div>
      )}
    </div>
  )
}

// =====================================================
// SUMMARY GRID
// =====================================================

function SummaryGrid({ summary }) {
  const cards = [
    {
      label: "Total Vehicles",
      value: summary.totalVehicles,
      helper: "Registered vehicle records",
      icon: Car,
      color: "bg-cyan-50 text-cyan-700",
    },
    {
      label: "Average Occupancy",
      value: summary.averageOccupancy,
      helper: "Current bay utilisation",
      icon: BarChart3,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "Total Revenue",
      value: `RM ${formatMoney(summary.totalRevenue)}`,
      helper: "Paid transactions",
      icon: Wallet,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Reservations",
      value: summary.reservations,
      helper: "Student/staff bookings",
      icon: CalendarCheck,
      color: "bg-amber-50 text-amber-700",
    },
    {
      label: "Guest Bookings",
      value: summary.guestBookings,
      helper: "Guest web bookings",
      icon: ScanLine,
      color: "bg-violet-50 text-violet-700",
    },
    {
      label: "ANPR Accuracy",
      value: summary.anprAccuracy,
      helper: "Approved detections ratio",
      icon: Radio,
      color: "bg-sky-50 text-sky-700",
    },
    {
      label: "Flagged Detections",
      value: summary.flaggedDetections,
      helper: "Need manual review",
      icon: AlertTriangle,
      color: "bg-red-50 text-red-700",
    },
    {
      label: "Active Issues",
      value: summary.activeIssues,
      helper: "Open support tickets",
      icon: LifeBuoy,
      color: "bg-orange-50 text-orange-700",
    },
  ]

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <SummaryCard key={card.label} card={card} />
      ))}
    </section>
  )
}

// =====================================================
// SUMMARY CARD
// =====================================================

function SummaryCard({ card }) {
  const Icon = card.icon

  return (
    <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{card.label}</p>

          <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
            {card.value}
          </h3>

          <p className="mt-1 text-xs font-semibold text-slate-400">
            {card.helper}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${card.color}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}

// =====================================================
// CHART CARD
// =====================================================

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-black text-slate-950">{title}</h3>

        {subtitle && (
          <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
        )}
      </div>

      {children}
    </div>
  )
}

// =====================================================
// EMPTY CHART
// =====================================================

function EmptyChart({ title = "No data yet", helper = "Data will appear when records exist." }) {
  return (
    <div className="flex h-80 items-center justify-center rounded-3xl bg-slate-50 text-center">
      <div>
        <p className="text-sm font-black text-slate-700">{title}</p>
        <p className="mt-1 text-xs font-semibold text-slate-400">{helper}</p>
      </div>
    </div>
  )
}

// =====================================================
// TRAFFIC CHART
// =====================================================

function TrafficChart({ data = [], title = "Traffic Analytics" }) {
  const chartData = data

  return (
    <ChartCard
      title={title}
      subtitle="ANPR entry, exit, and occupancy movement."
    >
      {chartData.length === 0 ? (
        <EmptyChart title="No traffic data yet" />
      ) : (
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={chartData} margin={{ top: 12, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip />
            <Legend />

            <Line type="monotone" dataKey="entries" name="Entries" stroke="#06b6d4" strokeWidth={3} />
            <Line type="monotone" dataKey="exits" name="Exits" stroke="#2563eb" strokeWidth={3} />
            <Line type="monotone" dataKey="occupancy" name="Occupancy %" stroke="#14b8a6" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

// =====================================================
// REVENUE TREND CHART
// =====================================================

function RevenueTrendChart({ data = [], title = "Revenue Trend" }) {
  const chartData = data

  return (
    <ChartCard
      title={title}
      subtitle="Reservation, parking, guest payment, and refund trend."
    >
      {chartData.length === 0 ? (
        <EmptyChart title="No revenue trend data yet" />
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData} margin={{ top: 12, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip formatter={(value) => `RM ${formatMoney(value)}`} />
            <Legend />

            <Area type="monotone" dataKey="reservation" name="Reservation Fee" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.18} />
            <Area type="monotone" dataKey="parking" name="After 7PM Parking" stroke="#2563eb" fill="#2563eb" fillOpacity={0.15} />
            <Area type="monotone" dataKey="guest" name="Guest Parking" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.16} />
            <Area type="monotone" dataKey="refund" name="Refund" stroke="#f97316" fill="#f97316" fillOpacity={0.12} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

// =====================================================
// REVENUE BREAKDOWN CHART
// =====================================================

function RevenueBreakdownChart({ data = [] }) {
  const chartData = data.filter((item) => Number(item.value || 0) > 0)

  return (
    <ChartCard
      title="Revenue Breakdown"
      subtitle="Reservation fee, parking fee, guest fee, and refunds."
    >
      {chartData.length === 0 ? (
        <EmptyChart title="No revenue breakdown yet" />
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Tooltip formatter={(value) => `RM ${formatMoney(value)}`} />
            <Legend />

            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={4}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={chartColors[index % chartColors.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

// =====================================================
// ZONE OCCUPANCY CHART
// =====================================================

function ZoneOccupancyChart({ data = [] }) {
  const chartData = data

  return (
    <ChartCard
      title="Occupancy by Zone"
      subtitle="Available and occupied bays by parking zone."
    >
      {chartData.length === 0 ? (
        <EmptyChart title="No zone data yet" />
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="zone" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="available" name="Available" fill="#14b8a6" radius={[10, 10, 0, 0]} />
            <Bar dataKey="occupied" name="Occupied / Unavailable" fill="#2563eb" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

// =====================================================
// ANPR DETECTION CHART
// =====================================================

function AnprDetectionChart({ data = [] }) {
  const chartData = data

  return (
    <ChartCard
      title="ANPR Detection Status"
      subtitle="Approved, flagged, and unknown detections."
    >
      {chartData.length === 0 ? (
        <EmptyChart title="No ANPR detection data yet" />
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="approved" name="Approved" fill="#14b8a6" radius={[10, 10, 0, 0]} />
            <Bar dataKey="flagged" name="Flagged" fill="#f97316" radius={[10, 10, 0, 0]} />
            <Bar dataKey="unknown" name="Unknown" fill="#64748b" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

// =====================================================
// BOOKING FLOW CHART
// =====================================================

function BookingFlowChart({ data = [] }) {
  const chartData = data

  return (
    <ChartCard
      title="Booking Flow"
      subtitle="Guest booking and reservation flow from creation to entry."
    >
      {chartData.length === 0 ? (
        <EmptyChart title="No booking flow data yet" />
      ) : (
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="guest" name="Guest Bookings" fill="#06b6d4" radius={[10, 10, 0, 0]} />
            <Bar dataKey="reservation" name="Reservations" fill="#8b5cf6" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

// =====================================================
// STATUS PIE CHART
// =====================================================

function StatusPieChart({ title, subtitle, data = [] }) {
  const chartData = data.filter((item) => Number(item.value || 0) > 0)

  return (
    <ChartCard title={title} subtitle={subtitle}>
      {chartData.length === 0 ? (
        <EmptyChart title="No status data yet" />
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Tooltip />
            <Legend />

            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              outerRadius={100}
              paddingAngle={4}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={chartColors[index % chartColors.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

// =====================================================
// MONTHLY COMPARISON CHART
// =====================================================

function MonthlyComparisonChart({ data = [], currentLabel, compareLabel }) {
  const chartData = data

  return (
    <ChartCard
      title="Monthly Comparison"
      subtitle={`${currentLabel} compared with ${compareLabel}.`}
    >
      {chartData.length === 0 ? (
        <EmptyChart title="No monthly comparison data yet" />
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="metric" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="current" name={currentLabel} fill="#06b6d4" radius={[10, 10, 0, 0]} />
            <Bar dataKey="compare" name={compareLabel} fill="#8b5cf6" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

// =====================================================
// LIVE PARKING FLOW CHART
// =====================================================

function LiveParkingFlowChart({ data = [] }) {
  const chartData = data

  return (
    <ChartCard
      title="Live Parking Flow"
      subtitle="Today’s ANPR entries, exits, and active parking movement."
    >
      {chartData.length === 0 ? (
        <EmptyChart title="No live parking flow yet" />
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="time" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="entries" name="Entries" stroke="#06b6d4" strokeWidth={3} />
            <Line type="monotone" dataKey="exits" name="Exits" stroke="#2563eb" strokeWidth={3} />
            <Line type="monotone" dataKey="active" name="Active" stroke="#14b8a6" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

// =====================================================
// LIVE ACTIVITY PANEL
// =====================================================

function LiveActivityPanel({ data = [] }) {
  const activities = data

  return (
    <ChartCard
      title="Live Activity"
      subtitle="Latest parking, payment, ANPR, booking, and support activity."
    >
      {activities.length === 0 ? (
        <EmptyChart title="No live activity yet" />
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <LiveItem
              key={activity.id}
              title={activity.title}
              description={activity.description}
              time={activity.time}
              status={activity.status}
            />
          ))}
        </div>
      )}
    </ChartCard>
  )
}

// =====================================================
// LIVE ALERTS PANEL
// =====================================================

function LiveAlertsPanel({ data = [] }) {
  const alerts = data

  return (
    <ChartCard
      title="Live Alerts"
      subtitle="Important alerts from ANPR, issues, and guest bookings."
    >
      {alerts.length === 0 ? (
        <EmptyChart title="No live alerts yet" />
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <LiveItem
              key={alert.id}
              title={alert.title}
              description={alert.description}
              time={alert.time}
              status={alert.status}
            />
          ))}
        </div>
      )}
    </ChartCard>
  )
}

// =====================================================
// LIVE ITEM
// =====================================================

function LiveItem({ title, description, time, status }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-800">{title}</p>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>

          <p className="mt-2 text-xs font-semibold text-slate-400">{time}</p>
        </div>

        <Pill label={status} />
      </div>
    </div>
  )
}

// =====================================================
// MONTHLY SUMMARY CARD
// =====================================================

function MonthlySummaryCard({ title, summary }) {
  return (
    <ChartCard title={title} subtitle="Monthly selected summary.">
      <div className="grid gap-3 sm:grid-cols-2">
        <InfoStat label="Vehicles" value={summary.totalVehicles} />
        <InfoStat label="Occupancy" value={summary.averageOccupancy} />
        <InfoStat label="Revenue" value={`RM ${formatMoney(summary.totalRevenue)}`} />
        <InfoStat label="Reservations" value={summary.reservations} />
        <InfoStat label="Guest Bookings" value={summary.guestBookings} />
        <InfoStat label="ANPR Accuracy" value={summary.anprAccuracy} />
        <InfoStat label="Flagged" value={summary.flaggedDetections} />
        <InfoStat label="Active Issues" value={summary.activeIssues} />
      </div>
    </ChartCard>
  )
}

// =====================================================
// INFO STAT
// =====================================================

function InfoStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-lg font-black text-slate-950">{value}</p>
    </div>
  )
}

// =====================================================
// HERO MINI STAT
// =====================================================

function HeroMiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 backdrop-blur">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-black text-cyan-300">{value}</p>
    </div>
  )
}

// =====================================================
// DATE INPUT
// =====================================================

function DateInput({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </label>

      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
      />
    </div>
  )
}

// =====================================================
// SELECT INPUT
// =====================================================

function SelectInput({ label, value, onChange, options }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// =====================================================
// PILL
// =====================================================

function Pill({ label }) {
  const styles = {
    Approved: "bg-emerald-50 text-emerald-700",
    Paid: "bg-cyan-50 text-cyan-700",
    Pending: "bg-amber-50 text-amber-700",
    Open: "bg-red-50 text-red-700",
    "In Progress": "bg-amber-50 text-amber-700",
    Resolved: "bg-emerald-50 text-emerald-700",
    Flagged: "bg-orange-50 text-orange-700",
    Unknown: "bg-slate-100 text-slate-600",
    Expired: "bg-orange-50 text-orange-700",
    Critical: "bg-red-50 text-red-700",
    High: "bg-orange-50 text-orange-700",
  }

  return (
    <span
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
        styles[label] || "bg-slate-100 text-slate-600"
      }`}
    >
      {label}
    </span>
  )
}

// =====================================================
// FORMAT MONEY
// =====================================================

function formatMoney(value) {
  return Number(value || 0).toFixed(2)
}

// =====================================================
// EXPORT
// =====================================================

export default Reports