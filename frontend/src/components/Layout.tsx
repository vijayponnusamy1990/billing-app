import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, FileText, BarChart, LogOut, Hexagon, Clock } from "lucide-react";

export default function Layout() {
    const location = useLocation();
    const navigate = useNavigate();
    const role = localStorage.getItem("role") || "SALES"; // Default to minimal permission

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/login");
    };

    // Define menu items with required roles
    // SALES: only Invoice
    // MANAGER: Invoice, Inventory (Products)
    // ADMIN: Everything
    const allNavItems = [
        { name: "Dashboard", path: "/", icon: LayoutDashboard, roles: ["ADMIN", "MANAGER", "SALES"] },
        { name: "Inventory", path: "/products", icon: Package, roles: ["ADMIN", "MANAGER"] },
        { name: "New Invoice", path: "/billing/new", icon: FileText, roles: ["ADMIN", "MANAGER", "SALES"] },
        { name: "Reports", path: "/reports", icon: BarChart, roles: ["ADMIN"] },
        { name: "History", path: "/history", icon: Clock, roles: ["ADMIN", "MANAGER", "SALES"] },
    ];

    const allowedNavItems = allNavItems.filter(item => item.roles.includes(role));

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-slate-100">
                    <Hexagon className="text-blue-600 mr-2" fill="currentColor" fillOpacity={0.1} />
                    <span className="font-bold text-lg tracking-tight text-slate-900">Glasses & Hardwares Ltd</span>
                </div>

                <div className="px-6 py-4">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Role</div>
                    <div className="text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1 rounded inline-block">
                        {role}
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {allowedNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    }`}
                            >
                                <Icon size={18} className={`mr-3 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut size={18} className="mr-3" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile Header */}
                <div className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4 justify-between">
                    <span className="font-bold text-lg text-slate-900">Glasses & Hardwares Ltd</span>
                    <button onClick={handleLogout} className="text-slate-500"><LogOut size={20} /></button>
                </div>

                <div className="flex-1 overflow-auto p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
