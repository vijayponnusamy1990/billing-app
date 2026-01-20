import { Link } from "react-router-dom";
import { Package, FileText, BarChart, TrendingUp, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { getDailySales } from "../api/reportsApi";

export default function DashboardPage() {
  const [salesToday, setSalesToday] = useState(0);
  const role = localStorage.getItem("role") || "SALES";

  useEffect(() => {
    // Only managers and admins can see sales stats? 
    // Actually typical sales reps might want to see their own sales, but endpoint is aggregated.
    // Let's hide it for SALES if we want to be strict, or just show it. 
    // User said: "Sales rep can only do invoicing". So strictly NO reports for them.
    if (role === 'ADMIN' || role === 'MANAGER') {
      getDailySales().then(data => {
        if (data.length > 0) {
          setSalesToday(data[0].total_sales);
        }
      }).catch(e => console.log("Report fetch failed usually due to permission"));;
    }
  }, [role]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your business performance.</p>
        </div>
        {(role === 'ADMIN' || role === 'MANAGER') && (
          <div className="text-right">
            <span className="text-sm text-slate-500">Today's Revenue</span>
            <div className="text-3xl font-bold text-green-600">₹{salesToday.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Products Card - ADMIN & MANAGER */}
        {(role === 'ADMIN' || role === 'MANAGER') && (
          <Link to="/products" className="group card hover:border-blue-200 hover:shadow-md transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                <Package size={24} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Inventory</h2>
                <p className="text-sm text-slate-500">Manage stocks & pricing</p>
              </div>
            </div>
            <div className="flex items-center text-sm font-medium text-blue-600 mt-4">
              Go to Inventory <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        )}

        {/* Invoice Card - EVERYONE */}
        <Link to="/billing/new" className="group card hover:border-indigo-200 hover:shadow-md transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">New Invoice</h2>
              <p className="text-sm text-slate-500">Create bills & items</p>
            </div>
          </div>
          <div className="flex items-center text-sm font-medium text-indigo-600 mt-4">
            Create Bill <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Reports Card - ADMIN ONLY */}
        {role === 'ADMIN' && (
          <Link to="/reports" className="group card hover:border-purple-200 hover:shadow-md transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                <BarChart size={24} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Reports</h2>
                <p className="text-sm text-slate-500">View sales analytics</p>
              </div>
            </div>
            <div className="flex items-center text-sm font-medium text-purple-600 mt-4">
              View Insights <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        )}
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-slate-400" />
          <h3 className="text-lg font-semibold">Quick Actions</h3>
        </div>
        <p className="text-slate-500">
          Logged in as <span className="font-bold">{role}</span>.
          {role === 'SALES' && " You can create invoices."}
          {role === 'MANAGER' && " You can manage inventory and invoices."}
          {role === 'ADMIN' && " You have full access."}
        </p>
      </div>
    </div>
  );
}
