import { Link } from "react-router-dom";
import { Package, FileText, BarChart, TrendingUp, ArrowRight, AlertTriangle, TrendingDown, User, Calendar, Filter, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { getDailySales, DailySales } from "../api/reportsApi";
import { getDashboardStats, getLowStockProducts, getTopProducts, getLeastProducts, getTopCustomers, DashboardStats, ProductStats, CustomerStats } from "../api/dashboardApi";
import { Product } from "../types";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart as RechartsBarChart, Bar, Cell
} from 'recharts';

export default function DashboardPage() {
  const [role, setRole] = useState(localStorage.getItem("role") || "SALES");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [topProducts, setTopProducts] = useState<ProductStats[]>([]);
  const [leastProducts, setLeastProducts] = useState<ProductStats[]>([]);
  const [topCustomers, setTopCustomers] = useState<CustomerStats[]>([]);
  const [dailyData, setDailyData] = useState<DailySales[]>([]);

  // Date Range State
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    // Only managers and admins can see detailed stats
    if (role === 'ADMIN' || role === 'MANAGER') {
      const fetchData = async () => {
        try {
          const [dailySalesData, dashboardStats, lowStockData, topProds, leastProds, topCusts] = await Promise.all([
            getDailySales(startDate, endDate),
            getDashboardStats(startDate, endDate),
            getLowStockProducts(), // Low stock is inventory snapshot, not date dependent usually
            getTopProducts(startDate, endDate),
            getLeastProducts(startDate, endDate),
            getTopCustomers(startDate, endDate)
          ]);

          setDailyData([...dailySalesData].reverse()); // Chronological order
          setStats(dashboardStats);
          setLowStock(lowStockData);
          setTopProducts(topProds);
          setLeastProducts(leastProds);
          setTopCustomers(topCusts);
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
        }
      };

      fetchData();
    }
  }, [role, startDate, endDate]);

  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444', '#f59e0b', '#10b981', '#06b6d4'];

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-slate-500 mt-1 font-medium">Real-time performance metrics and business insights.</p>
        </div>

        {/* Date Filter & Actions */}
        <div className="flex items-center gap-3">
          {(role === 'ADMIN' || role === 'MANAGER') && (
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
              <Calendar size={16} className="text-blue-500" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm border-none focus:ring-0 p-0 text-slate-700 font-semibold outline-none bg-transparent"
              />
              <span className="text-slate-300 font-bold px-1">→</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm border-none focus:ring-0 p-0 text-slate-700 font-semibold outline-none bg-transparent"
              />
            </div>
          )}
          <Link to="/billing/new" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95">
            <Plus size={18} strokeWidth={3} /> New Invoice
          </Link>
        </div>
      </div>

      {/* Overview Stats Cards */}
      {(role === 'ADMIN' || role === 'MANAGER') && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <TrendingUp size={80} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Total Revenue</span>
              <div className="text-3xl font-black text-slate-900">₹{stats.total_revenue.toLocaleString('en-IN')}</div>
              <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 w-fit px-2 py-1 rounded-full">
                <TrendingUp size={12} /> Live Sales
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <FileText size={80} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Orders / Invoices</span>
              <div className="text-3xl font-black text-slate-900">{stats.total_invoices}</div>
              <div className="mt-2 text-xs font-bold text-slate-400 bg-slate-50 w-fit px-2 py-1 rounded-full">
                In Period
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Package size={80} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Catalog Size</span>
              <div className="text-3xl font-black text-slate-900">{stats.total_products}</div>
              <div className="mt-2 text-xs font-bold text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded-full">
                Unique Items
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <AlertTriangle size={80} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Stock Alerts</span>
              <div className="text-3xl font-black text-slate-900">{stats.low_stock_count}</div>
              <div className={`mt-2 flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full w-fit ${stats.low_stock_count > 0 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
                {stats.low_stock_count > 0 ? 'Action Required' : 'All clear'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Insights Layer */}
      {(role === 'ADMIN' || role === 'MANAGER') && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Revenue Performance Area */}
          <div className="xl:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/20"><TrendingUp size={24} /></div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Revenue Velocity</h2>
                  <p className="text-sm text-slate-500 font-medium">Daily income distribution</p>
                </div>
              </div>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} dy={10} minTickGap={35} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} tickFormatter={(value) => `₹${value / 1000}k`} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    itemStyle={{ fontWeight: 800, color: '#1e293b' }}
                    labelStyle={{ marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px', fontWeight: 800, color: '#94a3b8' }}
                    formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="total_sales" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Product Performance Bar */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-lg shadow-purple-600/20"><BarChart size={24} /></div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Top Sellers</h2>
                <p className="text-sm text-slate-500 font-medium">Bestselling items volume</p>
              </div>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={topProducts.slice(0, 5)} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="total_sold" name="Qty" radius={[0, 8, 8, 0]} barSize={28}>
                    {topProducts.slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Operation Status Layer */}
      {(role === 'ADMIN' || role === 'MANAGER') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Detailed Customer Table Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><User size={20} /></div>
                <h3 className="font-black text-slate-900">Key Customers</h3>
              </div>
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full uppercase">Highest Spend</span>
            </div>
            <div className="divide-y divide-slate-100">
              {topCustomers.map((c, idx) => (
                <div key={idx} className="flex items-center gap-4 p-6 hover:bg-slate-50/80 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-black">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 truncate">{c.name}</div>
                    <div className="text-xs text-slate-500 font-semibold">{c.invoice_count} successful transactions</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-slate-900">₹{c.total_revenue.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              ))}
              {topCustomers.length === 0 && <div className="p-8 text-center text-slate-400 font-medium italic">No customer activity recorded in this period.</div>}
            </div>
          </div>

          {/* Combined Secondary Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-50 text-red-600 rounded-xl"><AlertTriangle size={20} /></div>
                <h3 className="font-black text-slate-900">Restock Soon</h3>
              </div>
              <div className="space-y-4">
                {lowStock.slice(0, 4).map(p => (
                  <div key={p.id} className="flex justify-between items-center">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-slate-800 truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Threshold: {p.low_stock_limit}</div>
                    </div>
                    <div className="bg-red-50 px-2 py-1 rounded-lg">
                      <span className="text-xs font-black text-red-600">{p.stock_qty} left</span>
                    </div>
                  </div>
                ))}
                {lowStock.length === 0 && <p className="text-center py-4 text-slate-300 font-bold italic">Healthy Stock levels</p>}
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-xl"><TrendingDown size={20} /></div>
                <h3 className="font-black text-slate-900">Slow Movers</h3>
              </div>
              <div className="space-y-4">
                {leastProducts.slice(0, 4).map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div className="min-w-0 flex-1 px-1">
                      <div className="text-sm font-bold text-slate-800 truncate">{p.name}</div>
                    </div>
                    <div className="text-xs font-black text-orange-600">
                      {p.total_sold} units
                    </div>
                  </div>
                ))}
                {leastProducts.length === 0 && <p className="text-center py-4 text-slate-300 font-bold italic">Gathering more data...</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
