import { Link } from "react-router-dom";
import {
  TrendingUp, TrendingDown, BarChart, PieChart, Calendar,
  ArrowRight, AlertTriangle, Plus, DollarSign, Package, Users
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  getDashboardStats, getLowStockProducts, getTopProducts,
  getLeastProducts, getTopCustomers,
  DashboardStats, ProductStats, CustomerStats
} from "../api/dashboardApi";
import { Product } from "../types";
import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart as RechartsPieChart, Pie
} from 'recharts';

export default function DashboardPage() {
  const [role] = useState(localStorage.getItem("role") || "SALES");

  // Stats State
  const [todayStats, setTodayStats] = useState<DashboardStats | null>(null);
  const [monthStats, setMonthStats] = useState<DashboardStats | null>(null);

  // Lists State (Driven by custom range)
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [topProducts, setTopProducts] = useState<ProductStats[]>([]);
  const [weakProducts, setWeakProducts] = useState<ProductStats[]>([]);
  const [topCustomers, setTopCustomers] = useState<CustomerStats[]>([]);

  // Custom Date Range State (Defaults to This Month)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const todayDate = now.toISOString().split('T')[0];

  const [customStart, setCustomStart] = useState(startOfMonth);
  const [customEnd, setCustomEnd] = useState(todayDate);

  useEffect(() => {
    if (role === 'ADMIN' || role === 'MANAGER') {
      const fetchFixedStats = async () => {
        try {
          const today = new Date().toISOString().split('T')[0];
          const mStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
          const mEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

          const [tStats, mStats, lowStockData] = await Promise.all([
            getDashboardStats(today, today),
            getDashboardStats(mStart, mEnd),
            getLowStockProducts()
          ]);

          setTodayStats(tStats);
          setMonthStats(mStats);
          setLowStock(lowStockData);
        } catch (error) {
          console.error("Error fetching fixed stats:", error);
        }
      };

      fetchFixedStats();
    }
  }, [role]);

  useEffect(() => {
    if (role === 'ADMIN' || role === 'MANAGER') {
      const fetchCustomData = async () => {
        try {
          const [topProds, weakProds, topCusts] = await Promise.all([
            getTopProducts(customStart, customEnd, 5, "sold"),
            getLeastProducts(customStart, customEnd, 5),
            getTopCustomers(customStart, customEnd, 5, "profit")
          ]);

          setTopProducts(topProds);
          setWeakProducts(weakProds);
          setTopCustomers(topCusts);
        } catch (error) {
          console.error("Error fetching custom data:", error);
        }
      };

      fetchCustomData();
    }
  }, [role, customStart, customEnd]);

  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444', '#f59e0b'];

  if (role !== 'ADMIN' && role !== 'MANAGER') {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <h2 className="text-2xl font-bold text-slate-700">Welcome, Sales Associate</h2>
        <p className="text-slate-500 mt-2">Please proceed to create invoices or manage orders.</p>
        <Link to="/billing/new" className="mt-6 btn-primary">Create New Invoice</Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="page-title">Executive Overview</h1>
          <p className="sub-text mt-1">Real-time performance metrics.</p>
        </div>
        <Link to="/billing/new" className="btn btn-primary">
          <Plus size={18} strokeWidth={3} /> New Invoice
        </Link>
      </div>

      {/* 1. FIXED KPI CARDS (Today vs Month) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sales / Revenue Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5"><DollarSign size={100} /></div>
          <h3 className="text-slate-500 font-bold uppercase text-xs tracking-wider mb-4">Total Sales (Revenue)</h3>
          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-end pb-4 border-b border-slate-50">
              <div>
                <div className="text-xs font-bold text-slate-400 mb-1">TODAY</div>
                <div className="text-2xl font-black text-slate-900">₹{todayStats?.total_revenue.toLocaleString('en-IN') || 0}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-400 mb-1">THIS MONTH</div>
                <div className="text-xl font-bold text-slate-600">₹{monthStats?.total_revenue.toLocaleString('en-IN') || 0}</div>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-md">Growth</span>
              {/* Simple comparison logic could go here */}
              <span className="text-slate-400">Live Updates</span>
            </div>
          </div>
        </div>

        {/* Profit Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5"><TrendingUp size={100} /></div>
          <h3 className="text-slate-500 font-bold uppercase text-xs tracking-wider mb-4">Net Profit</h3>
          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-end pb-4 border-b border-slate-50">
              <div>
                <div className="text-xs font-bold text-slate-400 mb-1">TODAY</div>
                <div className="text-2xl font-black text-emerald-600">₹{todayStats?.total_profit.toLocaleString('en-IN') || 0}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-400 mb-1">THIS MONTH</div>
                <div className="text-xl font-bold text-emerald-700/70">₹{monthStats?.total_profit.toLocaleString('en-IN') || 0}</div>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                {monthStats?.total_revenue ? Math.round((monthStats.total_profit / monthStats.total_revenue) * 100) : 0}% Margin
              </span>
              <span className="text-slate-400">Calculated</span>
            </div>
          </div>
        </div>

        {/* Product Volume Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5"><Package size={100} /></div>
          <h3 className="text-slate-500 font-bold uppercase text-xs tracking-wider mb-4">Products Sold (Qty)</h3>
          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-end pb-4 border-b border-slate-50">
              <div>
                <div className="text-xs font-bold text-slate-400 mb-1">TODAY</div>
                <div className="text-2xl font-black text-indigo-600">{todayStats?.total_items_sold || 0}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-400 mb-1">THIS MONTH</div>
                <div className="text-xl font-bold text-indigo-400">{monthStats?.total_items_sold || 0}</div>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{monthStats?.total_invoices || 0} Invoices</span>
              <span className="text-slate-400">Volume</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Low Stock Alert (Always Live) */}
      <div className="bg-orange-50/50 border border-orange-100 rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="text-orange-600" size={24} />
          <h3 className="text-lg font-black text-slate-900">Low Stock Alerts</h3>
          <span className="text-xs font-bold bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">Always Live</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {lowStock.length === 0 ? (
            <div className="col-span-4 text-center text-slate-400 italic font-medium py-2">Stock levels are healthy.</div>
          ) : (
            lowStock.slice(0, 8).map(p => (
              <div key={p.id} className="bg-white p-3 rounded-xl border border-orange-100 shadow-sm flex justify-between items-center">
                <span className="font-bold text-slate-700 text-sm truncate pr-2">{p.name}</span>
                <span className="text-xs font-black text-red-600 whitespace-nowrap">{p.stock_qty} left</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Detailed Analysis (Custom Range) */}
      <div>
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4">
          <h2 className="text-2xl font-extrabold text-slate-900">Detailed Analysis</h2>

          {/* Custom Range Picker */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
            <Calendar size={16} className="text-slate-400" />
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="text-sm font-bold text-slate-700 border-none p-0 focus:ring-0 outline-none"
            />
            <span className="text-slate-300">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="text-sm font-bold text-slate-700 border-none p-0 focus:ring-0 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Customers (By Profit/Sales) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-slate-900 flex items-center gap-2">
                <Users size={20} className="text-indigo-600" /> Top Customers
              </h3>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">By Profit & Sales</span>
            </div>
            <div className="space-y-4">
              {topCustomers.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                      <div className="text-[10px] font-bold text-slate-400">{c.invoice_count} orders</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-slate-900 text-sm">₹{c.total_revenue.toLocaleString('en-IN')}</div>
                    <div className="text-[10px] font-bold text-emerald-600">₹{c.total_profit.toLocaleString('en-IN')} Profit</div>
                  </div>
                </div>
              ))}
              {topCustomers.length === 0 && <p className="text-center text-slate-400 text-sm">No data for selected period.</p>}
            </div>
          </div>

          {/* Top & Weak Products */}
          <div className="space-y-8">
            {/* Top Products */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp size={20} className="text-emerald-600" /> Top Products
                </h3>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={topProducts} layout="vertical" margin={{ left: 0, right: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                    <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px' }} />
                    <Bar dataKey="total_sold" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weak Products */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-slate-900 flex items-center gap-2">
                  <TrendingDown size={20} className="text-rose-600" /> Weak Products
                </h3>
              </div>
              <div className="space-y-3">
                {weakProducts.map((p, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-600">{p.name}</span>
                    <span className="font-bold text-rose-600">{p.total_sold} units</span>
                  </div>
                ))}
                {weakProducts.length === 0 && <p className="text-center text-slate-400 text-sm">No data available.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
