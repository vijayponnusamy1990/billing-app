import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getInvoices } from "../api/invoicesApi";
import { Invoice } from "../types";
import { Eye, Clock, ChevronLeft, ChevronRight } from "lucide-react";

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        setLoading(true);
        const skip = (page - 1) * pageSize;
        getInvoices(skip, pageSize)
            .then(data => {
                setInvoices(data.items);
                setTotalPages(Math.ceil(data.total / pageSize));
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [page]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="page-title flex items-center gap-2">
                        <Clock className="text-blue-600" /> Invoice History
                    </h1>
                    <p className="sub-text mt-1">Monitor and manage your past transactions.</p>
                </div>
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
                        {invoices.length === 0 && !loading && (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-400">No invoices found.</td></tr>
                        )}
                        {loading && invoices.length === 0 && (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loading...</td></tr>
                        )}
                        {invoices.map((inv) => (
                            <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                <td className="table-td pl-6 font-mono font-medium text-blue-600">{inv.invoice_no}</td>
                                <td className="table-td text-slate-600">{new Date(inv.date).toLocaleDateString()}</td>
                                <td className="table-td font-medium">
                                    {inv.customer?.name || "Unknown"}
                                    {inv.customer?.gstin && <span className="text-xs ml-2 text-slate-400 bg-slate-100 px-1 rounded">GST</span>}
                                </td>
                                <td className="table-td text-right font-mono font-bold">₹{inv.grand_total.toLocaleString('en-IN')}</td>
                                <td className="table-td text-right pr-6">
                                    <Link to={`/invoices/${inv.id}`} className="text-slate-500 hover:text-blue-600 inline-flex items-center gap-1 text-sm font-medium">
                                        <Eye size={16} /> View
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
                    <div className="text-sm text-slate-500">
                        Page <span className="font-bold text-slate-700">{page}</span> of <span className="font-bold text-slate-700">{totalPages || 1}</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 bg-white border border-slate-300 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-white"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || totalPages === 0}
                            className="p-2 bg-white border border-slate-300 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-white"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
