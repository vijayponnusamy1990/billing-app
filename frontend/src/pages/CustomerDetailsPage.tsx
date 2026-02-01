import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, User, Phone, MapPin, FileText, Calendar, DollarSign, Clock, ArrowRight } from "lucide-react";
import { getCustomer, getCustomerInvoices, updateCustomer, Customer } from "../api/customersApi";

export default function CustomerDetailsPage() {
    const { id } = useParams();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const [custData, invData] = await Promise.all([
                    getCustomer(Number(id)),
                    getCustomerInvoices(Number(id))
                ]);
                setCustomer(custData);
                setInvoices(invData);
            } catch (error) {
                console.error("Failed to fetch customer details", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (isLoading) {
        return <div className="p-12 text-center text-slate-500">Loading details...</div>;
    }

    if (!customer) {
        return <div className="p-12 text-center">Customer not found.</div>;
    }

    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.grand_total || 0), 0);

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <Link to="/customers" className="inline-flex items-center text-slate-500 hover:text-blue-600 font-bold text-sm transition-colors mb-4">
                <ArrowLeft size={16} className="mr-1" /> Back to Customers
            </Link>

            {/* Profile Header */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5"><User size={120} /></div>
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-blue-500/30">
                        {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-3xl font-black text-slate-900">{customer.name}</h1>
                        <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium text-slate-600">
                            {customer.phone && (
                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                    <Phone size={16} className="text-blue-500" /> {customer.phone}
                                </div>
                            )}
                            {customer.billing_city && (
                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                    <MapPin size={16} className="text-indigo-500" /> {customer.billing_city}
                                </div>
                            )}
                            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                <span className="font-bold text-slate-400">ID:</span> #{customer.id}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 min-w-[150px]">
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Lifetime Value</div>
                            <div className="text-2xl font-black text-emerald-600">₹{totalRevenue.toLocaleString('en-IN')}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Invoice History */}
            <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-slate-400" /> Invoice History
                </h2>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    {invoices.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 italic">No invoices found for this customer.</div>
                    ) : (
                        <div className="w-full">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50">
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice #</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {invoices.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-900">{inv.invoice_no}</td>
                                            <td className="px-6 py-4 font-medium text-slate-600 text-sm">
                                                {new Date(inv.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-900 text-right">
                                                ₹{inv.grand_total.toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Link
                                                    to={`/invoices/${inv.id}`}
                                                    className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="View Invoice"
                                                >
                                                    <ArrowRight size={18} strokeWidth={2.5} /> {/* Wait, imported ArrowRight as simple icon? */}
                                                    {/* Changed detailed arrow to Eye or simple text */}
                                                    <span className="text-xs font-bold underline">View</span>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
