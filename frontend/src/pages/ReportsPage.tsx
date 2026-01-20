import { useEffect, useState } from "react";
import { getDailySales, getProductSales, DailySales, ProductSales } from "../api/reportsApi";
import { Calendar, Tag, ChevronDown } from "lucide-react";

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState<"daily" | "product">("daily");
    const [dailyData, setDailyData] = useState<DailySales[]>([]);
    const [productData, setProductData] = useState<ProductSales[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        if (activeTab === "daily") {
            getDailySales().then(setDailyData).finally(() => setLoading(false));
        } else {
            getProductSales().then(setProductData).finally(() => setLoading(false));
        }
    }, [activeTab]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Sales Reports</h1>
                    <p className="text-slate-500">Analyze your sales performance over time.</p>
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

            <div className="card overflow-hidden p-0">
                {loading ? (
                    <div className="p-12 text-center text-slate-500">Loading report data...</div>
                ) : (
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
                )}
            </div>
        </div>
    );
}
