"use client"

import { useState, useEffect, useCallback } from "react"
import { apkDownloadService, DownloadRecord, DownloadListFilters } from "@/services/apkDownloadService"
import {
  Download,
  Smartphone,
  TrendingUp,
  Calendar,
  Users,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  X,
} from "lucide-react"

// ─── types ───────────────────────────────────────────────────────────────────

interface DownloadStats {
  totalDownloads: number
  uniqueUsers: number
  androidDownloads: number
  iosDownloads: number
  downloadsToday: number
  downloadsThisWeek: number
  downloadsThisMonth: number
  roleBreakdown: Record<string, number>
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

type TabType = "overview" | "downloads"

const ROLE_COLORS: Record<string, string> = {
  CUSTOMER: "bg-blue-100 text-blue-700",
  ORGANIZATION: "bg-purple-100 text-purple-700",
  SERVICE_PROVIDER: "bg-green-100 text-green-700",
  TAILOR: "bg-orange-100 text-orange-700",
}

const ROLE_BAR_COLORS: Record<string, string> = {
  CUSTOMER: "bg-blue-500",
  ORGANIZATION: "bg-purple-500",
  SERVICE_PROVIDER: "bg-green-500",
  TAILOR: "bg-orange-500",
}

// ─── stat card ────────────────────────────────────────────────────────────────

const StatCard = ({
  icon: Icon,
  title,
  value,
  subtitle,
  color = "purple",
}: {
  icon: React.ElementType
  title: string
  value: number | string
  subtitle?: string
  color?: "purple" | "blue" | "green" | "orange"
}) => {
  const colorClasses = {
    purple: "bg-purple-50 border-purple-200 text-purple-600",
    blue: "bg-blue-50 border-blue-200 text-blue-600",
    green: "bg-green-50 border-green-200 text-green-600",
    orange: "bg-orange-50 border-orange-200 text-orange-600",
  }
  return (
    <div className={`border rounded-xl p-5 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium opacity-75 mb-1">{title}</p>
          <p className="text-3xl font-bold mb-1">{value.toLocaleString()}</p>
          {subtitle && <p className="text-xs opacity-75">{subtitle}</p>}
        </div>
        <div className="p-2.5 rounded-lg bg-white bg-opacity-60">
          <Icon size={22} />
        </div>
      </div>
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function MobileAppStatsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview")

  // stats
  const [stats, setStats] = useState<DownloadStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState("")

  // download list
  const [downloads, setDownloads] = useState<DownloadRecord[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState("")

  // filters
  const [filters, setFilters] = useState<DownloadListFilters>({
    page: 1,
    limit: 50,
    platform: "",
    role: "",
    startDate: "",
    endDate: "",
  })

  // ── fetch stats ─────────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    setStatsError("")
    try {
      const token = localStorage.getItem("userToken") || localStorage.getItem("authToken") || ""
      const response = await apkDownloadService.getDownloadStats(token)
      if (response.success) {
        setStats(response.data as DownloadStats)
      } else {
        throw new Error(response.message || "Failed to fetch statistics")
      }
    } catch (err: unknown) {
      setStatsError(err instanceof Error ? err.message : "Failed to fetch statistics")
    } finally {
      setStatsLoading(false)
    }
  }, [])

  // ── fetch download list ─────────────────────────────────────────────────────

  const fetchDownloads = useCallback(async () => {
    setListLoading(true)
    setListError("")
    try {
      const token = localStorage.getItem("userToken") || localStorage.getItem("authToken") || ""
      // strip empty strings so they don't get sent as query params
      const cleanFilters: DownloadListFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== "" && v !== undefined)
      )
      const response = await apkDownloadService.getDownloadList(token, cleanFilters)
      if (response.success) {
        setDownloads(response.data.downloads)
        setPagination(response.data.pagination)
      } else {
        throw new Error(response.message || "Failed to fetch download list")
      }
    } catch (err: unknown) {
      setListError(err instanceof Error ? err.message : "Failed to fetch download list")
    } finally {
      setListLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    if (activeTab === "downloads") fetchDownloads()
  }, [activeTab, fetchDownloads])

  // ── filter helpers ──────────────────────────────────────────────────────────

  const setFilter = (key: keyof DownloadListFilters, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key !== "page" ? 1 : (value as number) }))
  }

  const clearFilters = () => {
    setFilters({ page: 1, limit: 50, platform: "", role: "", startDate: "", endDate: "" })
  }

  const hasActiveFilters =
    filters.platform || filters.role || filters.startDate || filters.endDate

 

  const pct = (part: number, total: number) =>
    total > 0 ? ((part / total) * 100).toFixed(1) : "0.0"


  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mobile App Statistics</h1>
            <p className="text-gray-500 text-sm mt-1">
              Track app downloads and user engagement across platforms
            </p>
          </div>
          <button
            onClick={() => { fetchStats(); if (activeTab === "downloads") fetchDownloads() }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5D2A8B] text-white text-sm font-medium hover:bg-[#4a2070] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-6 w-fit">
          {(["overview", "downloads"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? "bg-[#5D2A8B] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab === "overview" ? "Overview" : "Download List"}
            </button>
          ))}
        </div>

     
        {activeTab === "overview" && (
          <>
            {statsLoading ? (
              <div className="flex justify-center items-center py-32">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#5D2A8B]" />
              </div>
            ) : statsError ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-md">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-red-600 text-sm">{statsError}</p>
                  <button
                    onClick={fetchStats}
                    className="mt-4 px-5 py-2 bg-[#5D2A8B] text-white rounded-lg text-sm hover:bg-[#4a2070] transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : stats ? (
              <>
               
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <StatCard icon={Download} title="Total Downloads" value={stats.totalDownloads} subtitle="All time" color="purple" />
                  <StatCard icon={Users} title="Unique Users" value={stats.uniqueUsers} subtitle="Distinct users" color="blue" />
                  <StatCard
                    icon={Smartphone}
                    title="Android Downloads"
                    value={stats.androidDownloads}
                    subtitle={`${pct(stats.androidDownloads, stats.totalDownloads)}% of total`}
                    color="green"
                  />
                  <StatCard
                    icon={Smartphone}
                    title="iOS Downloads"
                    value={stats.iosDownloads}
                    subtitle={`${pct(stats.iosDownloads, stats.totalDownloads)}% of total`}
                    color="orange"
                  />
                </div>

               
                <div className="mb-6">
                  <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#5D2A8B]" />
                    Download Trends
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard icon={TrendingUp} title="Today" value={stats.downloadsToday} subtitle="Last 24 hours" color="purple" />
                    <StatCard icon={TrendingUp} title="This Week" value={stats.downloadsThisWeek} subtitle="Last 7 days" color="blue" />
                    <StatCard icon={TrendingUp} title="This Month" value={stats.downloadsThisMonth} subtitle="Last 30 days" color="green" />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-base font-semibold text-gray-800 mb-5">Platform Distribution</h2>
                    <div className="space-y-4">
                      {[
                        { label: "Android", value: stats.androidDownloads, color: "bg-green-500" },
                        { label: "iOS", value: stats.iosDownloads, color: "bg-orange-500" },
                      ].map(({ label, value, color }) => (
                        <div key={label}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-medium text-gray-700">{label}</span>
                            <span className="text-sm font-semibold text-gray-900">
                              {value.toLocaleString()} ({pct(value, stats.totalDownloads)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5">
                            <div
                              className={`${color} h-2.5 rounded-full transition-all duration-700`}
                              style={{ width: `${pct(value, stats.totalDownloads)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {pct(stats.androidDownloads, stats.totalDownloads)}%
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">Android Users</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-orange-600">
                          {pct(stats.iosDownloads, stats.totalDownloads)}%
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">iOS Users</p>
                      </div>
                    </div>
                  </div>

                  {/* Role breakdown */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-base font-semibold text-gray-800 mb-5">Downloads by Role</h2>
                    {stats.roleBreakdown && Object.keys(stats.roleBreakdown).length > 0 ? (
                      <div className="space-y-4">
                        {Object.entries(stats.roleBreakdown)
                          .sort(([, a], [, b]) => b - a)
                          .map(([role, count]) => (
                            <div key={role}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span
                                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                    ROLE_COLORS[role] ?? "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {role}
                                </span>
                                <span className="text-sm font-semibold text-gray-900">
                                  {count.toLocaleString()} ({pct(count, stats.totalDownloads)}%)
                                </span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <div
                                  className={`${ROLE_BAR_COLORS[role] ?? "bg-gray-400"} h-2.5 rounded-full transition-all duration-700`}
                                  style={{ width: `${pct(count, stats.totalDownloads)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-8">No role data available</p>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </>
        )}

       
        {activeTab === "downloads" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            {/* Filter bar */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mr-1">
                  <Filter className="w-4 h-4" />
                  <span className="font-medium">Filters</span>
                </div>

                {/* Platform */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Platform</label>
                  <select
                    value={filters.platform}
                    onChange={(e) => setFilter("platform", e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5D2A8B]"
                  >
                    <option value="">All Platforms</option>
                    <option value="android">Android</option>
                    <option value="ios">iOS</option>
                  </select>
                </div>

                {/* Role */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Role</label>
                  <select
                    value={filters.role}
                    onChange={(e) => setFilter("role", e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5D2A8B]"
                  >
                    <option value="">All Roles</option>
                    <option value="CUSTOMER">Customer</option>
                    <option value="ORGANIZATION">Organization</option>
                    <option value="SERVICE_PROVIDER">Service Provider</option>
                    <option value="TAILOR">Tailor</option>
                  </select>
                </div>

                {/* Start date */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">From</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilter("startDate", e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5D2A8B]"
                  />
                </div>

                {/* End date */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">To</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilter("endDate", e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5D2A8B]"
                  />
                </div>

                {/* Per page */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Per page</label>
                  <select
                    value={filters.limit}
                    onChange={(e) => setFilter("limit", Number(e.target.value))}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5D2A8B]"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition-colors self-end"
                  >
                    <X className="w-3.5 h-3.5" />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Error */}
            {listError && (
              <div className="mx-6 mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {listError}
                <button className="ml-auto" onClick={() => setListError("")}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Table */}
            {listLoading ? (
              <div className="flex justify-center items-center py-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5D2A8B]" />
              </div>
            ) : downloads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Download className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm">No download records found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                      <th className="px-5 py-3">User</th>
                      <th className="px-5 py-3">Role</th>
                      <th className="px-5 py-3">Platform</th>
                      <th className="px-5 py-3">Downloaded At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {downloads.map((d) => (
                      <tr key={d._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-900">{d.fullName}</p>
                          <p className="text-xs text-gray-400">{d.email}</p>
                          {d.phoneNumber && (
                            <p className="text-xs text-gray-400">{d.phoneNumber}</p>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              ROLE_COLORS[d.userRole] ?? "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {d.userRole}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                              d.platform === "android"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {d.platform === "android" ? "🤖" : "🍎"}
                            {d.platform === "android" ? "Android" : "iOS"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                          {new Date(d.downloadedAt).toLocaleDateString("en-NG", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                          <br />
                          <span className="text-xs text-gray-400">
                            {new Date(d.downloadedAt).toLocaleTimeString("en-NG", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing{" "}
                  <span className="font-medium text-gray-700">
                    {((pagination.page - 1) * pagination.limit) + 1}–
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{" "}
                  of <span className="font-medium text-gray-700">{pagination.total.toLocaleString()}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setFilter("page", pagination.page - 1)}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600 px-2">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setFilter("page", pagination.page + 1)}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}