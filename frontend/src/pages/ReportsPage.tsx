import { useEffect, useState, useMemo } from "react";
import { getDailySales, getProductSales, DailySales, ProductSales } from "../api/reportsApi";
import { Calendar, Tag, BarChart3, TrendingUp, Filter } from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, Legend
} from 'recharts';

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState<"daily" | "product">("daily");
    const [dailyData, setDailyData] = useState<DailySales[]>([]);
    const [productData, setProductData] = useState<ProductSales[]>([]);
    const [loading, setLoading] = useState(false);

    // Date Range State
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        setLoading(true);
        const fetchData = async () => {
            try {
                if (activeTab === "daily") {
                    const data = await getDailySales(startDate, endDate);
                    // Ensure chronological order for chart
                    setDailyData([...data].reverse());
                } else {
                    const data = await getProductSales(startDate, endDate);
                    setProductData(data);
                }
            } catch (error) {
                console.error("Failed to fetch reports", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [activeTab, startDate, endDate]);

    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444', '#f59e0b', '#10b981', '#06b6d4'];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Sales Reports</h1>
                    <p className="text-slate-500">Analyze your sales performance over time.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                        <Filter size={14} className="text-slate-400" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="text-sm border-none focus:ring-0 p-0 text-slate-600 outline-none"
                        />
                        <span className="text-slate-300">to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="text-sm border-none focus:ring-0 p-0 text-slate-600 outline-none"
                        />
                    </div>

                    <div className="flex bg-white rounded-lg p-1 shadow-sm border border-slate-200">
                        <button
                            onClick={() => setActiveTab("daily")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'daily' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            <Calendar size={16} /> Daily Sales
                        </button>
                        <button
                            onClick={() => setActiveTab("product")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'product' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            <Tag size={16} /> Product Sales
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="card p-12 text-center text-slate-500">Loading report data...</div>
            ) : (
                <div className="space-y-6">
                    {/* Visualizations */}
                    <div className="grid grid-cols-1 gap-6">
                        {activeTab === "daily" ? (
                            <div className="card p-6">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><TrendingUp size={20} /></div>
                                    <h2 className="font-semibold text-slate-800">Revenue Trend</h2>
                                </div>
                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="date"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 12 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 12 }}
                                                tickFormatter={(value) => `₹${value}`}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="total_sales"
                                                stroke="#6366f1"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorSales)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : (
                            <div className="card p-6">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><BarChart3 size={20} /></div>
                                    <h2 className="font-semibold text-slate-800">Top Products by Quantity</h2>
                                </div>
                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={productData.slice(0, 10)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="product_name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 10 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 12 }}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar dataKey="total_qty" name="Quantity Sold" radius={[4, 4, 0, 0]}>
                                                {(productData.slice(0, 10)).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="card overflow-hidden p-0">
                        <div className="overflow-x-auto">
                            {activeTab === "daily" ? (
                                <table className="w-full">
                                    <thead>
                                        <tr>
                                            <th className="table-th text-left pl-6">Date</th>
                                            <th className="table-th text-right">Invoices Generated</th>
                                            <th className="table-th text-right pr-6">Total Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dailyData.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-slate-500">No sales records found.</td></tr>}
                                        {dailyData.map((d, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-none">
                                                <td className="table-td pl-6 font-medium font-mono text-slate-700">{d.date}</td>
                                                <td className="table-td text-right">{d.invoice_count}</td>
                                                <td className="table-td text-right pr-6 font-mono font-bold text-green-600">₹{d.total_sales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <table className="w-full">
                                    <thead>
                                        <tr>
                                            <th className="table-th text-left pl-6">Product Name</th>
                                            <th className="table-th text-left">Category</th>
                                            <th className="table-th text-right">Qty Sold</th>
                                            <th className="table-th text-right pr-6">Total Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {productData.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">No sales records found.</td></tr>}
                                        {productData.map((p, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-none">
                                                <td className="table-td pl-6 font-medium text-slate-900">{p.product_name}</td>
                                                <td className="table-td"><span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded">{p.category}</span></td>
                                                <td className="table-td text-right font-mono">{p.total_qty}</td>
                                                <td className="table-td text-right pr-6 font-mono font-bold text-green-600">₹{p.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
