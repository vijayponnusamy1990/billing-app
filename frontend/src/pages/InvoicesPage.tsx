import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getInvoices } from "../api/invoicesApi";
import { Invoice } from "../types";
import { Eye, Clock } from "lucide-react";

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getInvoices()
            .then(setInvoices)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Clock className="text-blue-600" /> Invoice History
                </h1>
            </div>

            <div className="card p-0 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="table-th pl-6">Invoice #</th>
                            <th className="table-th">Date</th>
                            <th className="table-th">Customer</th>
                            <th className="table-th text-right">Amount</th>
                            <th className="table-th text-right pr-6">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.length === 0 && (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-400">No invoices found.</td></tr>
                        )}
                        {invoices.map((inv) => (
                            <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50">
                                <td className="table-td pl-6 font-mono font-medium text-blue-600">{inv.invoice_no}</td>
                                <td className="table-td text-slate-600">{new Date(inv.date).toLocaleDateString()}</td>
                                <td className="table-td font-medium">
                                    {inv.customer?.name || "Unknown"}
                                    {inv.customer?.gstin && <span className="text-xs ml-2 text-slate-400 bg-slate-100 px-1 rounded">GST</span>}
                                </td>
                                <td className="table-td text-right font-mono font-bold">₹{inv.grand_total.toFixed(2)}</td>
                                <td className="table-td text-right pr-6">
                                    <Link to={`/invoices/${inv.id}`} className="text-slate-500 hover:text-blue-600 inline-flex items-center gap-1 text-sm font-medium">
                                        <Eye size={16} /> View
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
