import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getInvoice } from "../api/invoicesApi";
import { Invoice } from "../types";
import { Printer, ArrowLeft, Hexagon } from "lucide-react";

export default function InvoiceDetailsPage() {
    const { id } = useParams();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            getInvoice(Number(id))
                .then(setInvoice)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!invoice) return <div className="p-8">Invoice not found</div>;

    return (
        <div className="max-w-4xl mx-auto p-8">
            <div className="mb-6 flex justify-between items-center print:hidden">
                <Link to="/history" className="text-slate-500 hover:text-slate-800 flex items-center gap-2">
                    <ArrowLeft size={18} /> Back to History
                </Link>
                <button onClick={handlePrint} className="btn-primary flex items-center gap-2">
                    <Printer size={18} /> Print Invoice
                </button>
            </div>

            {/* Printable Invoice Area */}
            <div className="bg-white p-8 shadow-sm border border-slate-200 print:shadow-none print:border-none rounded-xl" id="invoice-print">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-8 mb-8">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                            <Hexagon className="text-blue-600" fill="currentColor" fillOpacity={0.1} size={32} />
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Glasses & Hardwares Ltd</h1>
                        </div>
                        <p className="text-slate-500 text-sm max-w-xs">
                            123, Industrial Area, Tech City, <br />
                            Bangalore, Karnataka - 560001 <br />
                            Ph: +91 98765 43210 <br />
                            GSTIN: 29ABCDE1234F1Z5
                        </p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold text-slate-800 mb-1">INVOICE</h2>
                        <p className="font-mono text-lg text-slate-600 mb-1">#{invoice.invoice_no}</p>
                        <p className="text-slate-500 text-sm">Date: {new Date(invoice.date).toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Customer Details */}
                <div className="mb-8 p-6 bg-slate-50 rounded-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Bill To</h3>
                    <p className="font-bold text-slate-900 text-lg">{invoice.customer?.name}</p>
                    {invoice.customer?.address && <p className="text-slate-600">{invoice.customer.address}</p>}
                    {invoice.customer?.phone && <p className="text-slate-600">Ph: {invoice.customer.phone}</p>}
                    {invoice.customer?.gstin && <p className="text-slate-600 mt-2 font-mono text-sm">GSTIN: {invoice.customer.gstin}</p>}
                </div>

                {/* Items Table */}
                <table className="w-full mb-8">
                    <thead>
                        <tr className="border-b-2 border-slate-100">
                            <th className="text-left py-3 text-sm font-bold text-slate-600">Item</th>
                            <th className="text-center py-3 text-sm font-bold text-slate-600">Qty</th>
                            <th className="text-right py-3 text-sm font-bold text-slate-600">Rate</th>
                            <th className="text-right py-3 text-sm font-bold text-slate-600">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {invoice.items.map((item, idx) => (
                            <tr key={idx}>
                                <td className="py-3">
                                    <p className="font-medium text-slate-800">{item.description}</p>
                                    <p className="text-xs text-slate-400">
                                        {item.unit === 'SQFT' ? `${item.length_ft}' x ${item.width_ft}'` : ''}
                                    </p>
                                </td>
                                <td className="text-center py-3 text-slate-600">
                                    {item.quantity} {item.unit === 'SQFT' ? 'pcs' : ''}
                                </td>
                                <td className="text-right py-3 font-mono text-slate-600">₹{item.rate}</td>
                                <td className="text-right py-3 font-mono font-medium text-slate-800">₹{item.taxable_amount.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end border-t border-slate-200 pt-6">
                    <div className="w-64 space-y-2">
                        <div className="flex justify-between text-slate-600">
                            <span>Subtotal</span>
                            <span className="font-mono">₹{invoice.total_taxable.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 text-sm">
                            <span>CGST</span>
                            <span className="font-mono">₹{invoice.total_cgst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 text-sm">
                            <span>SGST</span>
                            <span className="font-mono">₹{invoice.total_sgst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-bold text-slate-900 mt-2">
                            <span>Grand Total</span>
                            <span className="font-mono">₹{invoice.grand_total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center text-slate-400 text-xs pt-8 border-t border-slate-100">
                    <p>Computer generated invoice.</p>
                </div>
            </div>
        </div>
    );
}
