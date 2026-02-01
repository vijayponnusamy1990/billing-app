import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { getInvoice } from "../api/invoicesApi";
import { Invoice } from "../types";
import { Printer, ArrowLeft, Hexagon, QrCode } from "lucide-react";
import { numberToWords } from "../utils/numberToWords";

export default function InvoiceDetailsPage() {
    const { id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
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

    useEffect(() => {
        if (!loading && invoice && searchParams.get('print') === 'true') {
            const timer = setTimeout(() => {
                window.print();
                const nextParams = new URLSearchParams(searchParams);
                nextParams.delete('print');
                setSearchParams(nextParams, { replace: true });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [loading, invoice, searchParams, setSearchParams]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!invoice) return <div className="p-8">Invoice not found</div>;

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 font-sans">
            <div className="mb-6 flex justify-between items-center print:hidden">
                <Link to="/history" className="text-slate-500 hover:text-slate-800 flex items-center gap-2">
                    <ArrowLeft size={18} /> Back to History
                </Link>
                <button onClick={handlePrint} className="btn-primary flex items-center gap-2">
                    <Printer size={18} /> Print Invoice
                </button>
            </div>

            {/* Printable Invoice Area - A4 Size constrained */}
            <div className="bg-white shadow-lg print:shadow-none print:w-full max-w-[210mm] mx-auto min-h-[297mm] text-slate-900 leading-snug text-xs flex flex-col" id="invoice-print">

                {/* 1. Header with Logo and Address */}
                <div className="flex justify-between items-start px-4 pt-4 pb-2">
                    <div className="w-2/3">
                        <h1 className="text-3xl font-extrabold text-slate-900 uppercase tracking-tight">Glasses & Hardwares Ltd</h1>
                    </div>
                    <div className="w-1/3 flex justify-end">
                        <div className="text-right">
                            <div className="w-12 h-12 bg-teal-600 text-white flex items-center justify-center rounded-lg font-bold text-2xl ml-auto">G</div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 mt-1 tracking-widest">LogoText</p>
                        </div>
                    </div>
                </div>

                {/* 2. Banner */}
                <div className="bg-teal-600 text-white px-4 py-2 font-bold text-sm tracking-wide">
                    Manufacturing & Supply of Glass Hardware & Fittings
                </div>

                {/* 3. Address & Contact Row */}
                <div className="border-b border-black flex justify-between items-center px-4 py-3">
                    <div className="text-xs">
                        <p>123, Industrial Area, Tech City,</p>
                        <p>Bangalore, Karnataka - 560001</p>
                    </div>
                    <div className="text-right text-xs">
                        <p><span className="font-bold">Tel :</span> +91 98765 43210</p>
                        <p><span className="font-bold">Web :</span> www.glassesAndHardwares.com</p>
                        <p><span className="font-bold">Email :</span> support@glasses.com</p>
                    </div>
                </div>

                {/* 4. Status Bar (PAN | INVOICE | ORIGINAL) */}
                <div className="flex border-b border-black">
                    <div className="flex-1 px-4 py-1.5 font-bold border-r border-black">PAN : 29ABCDE1234F</div>
                    <div className="flex-1 px-4 py-1.5 font-bold text-center text-lg uppercase">TAX INVOICE</div>
                    <div className="flex-1 px-4 py-1.5 font-bold text-right text-[10px] uppercase pt-2">Original For Recipient</div>
                </div>

                {/* 5. Customer & Invoice Details Grid */}
                <div className="flex border-b border-black">
                    {/* Left: Customer */}
                    <div className="w-1/2 border-r border-black">
                        <div className="bg-slate-50 border-b border-black px-2 py-1 font-bold text-center">Customer Detail</div>
                        <div className="grid grid-cols-[80px_1fr] gap-y-1 p-2">
                            <span className="font-bold">M/S</span>
                            <span className="font-bold">{invoice.customer?.name}</span>

                            <span className="font-bold">Address</span>
                            <span className="whitespace-pre-wrap">
                                {[
                                    invoice.customer?.billing_line1,
                                    invoice.customer?.billing_line2,
                                    invoice.customer?.billing_city,
                                    invoice.customer?.billing_state,
                                    invoice.customer?.billing_zip
                                ].filter(Boolean).join(", ")}
                            </span>

                            <span className="font-bold">Phone</span>
                            <span>{invoice.customer?.phone}</span>

                            <span className="font-bold">GSTIN</span>
                            <span>{invoice.customer?.gstin}</span>

                            <span className="font-bold">Place of Supply</span>
                            <span>Karnataka (29)</span>
                        </div>
                    </div>

                    {/* Right: Invoice Info */}
                    <div className="w-1/2">
                        <div className="grid grid-cols-2 h-full">
                            {/* Col 1 */}
                            <div className="border-r border-black">
                                <div className="p-1 px-2 border-b border-gray-300 flex justify-between items-center h-8">
                                    <span className="">Invoice No.</span>
                                    <span className="font-bold">{invoice.invoice_no}</span>
                                </div>
                                <div className="p-1 px-2 border-b border-gray-300 flex justify-between items-center h-8">
                                    <span className="">Challan No</span>
                                    <span className="font-bold">-</span>
                                </div>
                                <div className="p-1 px-2 border-b border-gray-300 flex justify-between items-center h-8">
                                    <span className="">E-Way Bill No.</span>
                                    <span className="font-bold">-</span>
                                </div>
                                <div className="p-1 px-2 flex justify-between items-center h-8">
                                    <span className="">Transport</span>
                                    <span className="font-bold">Local</span>
                                </div>
                            </div>
                            {/* Col 2 */}
                            <div>
                                <div className="p-1 px-2 border-b border-gray-300 flex justify-between items-center h-8">
                                    <span className="">Invoice Date</span>
                                    <span className="font-bold">{new Date(invoice.date).toLocaleDateString()}</span>
                                </div>
                                <div className="p-1 px-2 border-b border-gray-300 flex justify-between items-center h-8">
                                    <span className="">Challan Date</span>
                                    <span className="font-bold">-</span>
                                </div>
                                <div className="p-1 px-2 border-b border-gray-300 flex justify-between items-center h-8">
                                    <span className="">PO No.</span>
                                    <span className="font-bold">-</span>
                                </div>
                                <div className="p-1 px-2 flex justify-between items-center h-8">
                                    <span className="">Vehicle No.</span>
                                    <span className="font-bold">-</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 6. Items Table */}
                <div className="flex-1 flex flex-col border-b border-black min-h-[400px]">
                    <div className="flex border-b border-black font-bold text-center bg-slate-50">
                        <div className="w-10 py-2 border-r border-black">Sr.</div>
                        <div className="flex-1 py-2 border-r border-black">Name of Product / Service</div>
                        <div className="w-20 py-2 border-r border-black">HSN / SAC</div>
                        <div className="w-12 py-2 border-r border-black">Qty</div>
                        <div className="w-20 py-2 border-r border-black">Rate</div>
                        <div className="w-24 py-2 border-r border-black">Taxable Value</div>
                        <div className="w-32 border-r border-black flex flex-col">
                            <div className="border-b border-black py-0.5 text-[10px]">IGST</div>
                            <div className="flex flex-1">
                                <div className="w-1/2 border-r border-black py-1 text-[10px]">%</div>
                                <div className="w-1/2 py-1 text-[10px]">Amount</div>
                            </div>
                        </div>
                        <div className="w-24 py-2">Total</div>
                    </div>

                    {/* Rows */}
                    {invoice.items.map((item, idx) => (
                        <div key={idx} className="flex border-b border-gray-100 last:border-0">
                            <div className="w-10 py-1 border-r border-black text-center">{idx + 1}</div>
                            <div className="flex-1 py-1 px-2 border-r border-black font-bold text-slate-800">
                                {item.description}
                                <div className="text-[9px] font-normal text-slate-500">
                                    {[item.thickness, item.dimension].filter(Boolean).join(' | ')}
                                </div>
                            </div>
                            <div className="w-20 py-1 border-r border-black text-center">{item.hsn_code || '8302'}</div>
                            <div className="w-12 py-1 border-r border-black text-center font-bold">{item.quantity} <span className="text-[8px] font-normal">NOS</span></div>
                            <div className="w-20 py-1 border-r border-black text-right px-1">{item.rate.toFixed(2)}</div>
                            <div className="w-24 py-1 border-r border-black text-right px-1">{item.taxable_amount.toFixed(2)}</div>
                            <div className="w-32 border-r border-black flex">
                                <div className="w-1/2 border-r border-black text-center py-1 text-[10px] 300">{(item.igst_rate + item.cgst_rate + item.sgst_rate)}</div>
                                <div className="w-1/2 text-right px-1 py-1 text-[10px]">{(item.igst_amount + item.cgst_amount + item.sgst_amount).toFixed(2)}</div>
                            </div>
                            <div className="w-24 py-1 text-right px-1 font-bold">{(item.taxable_amount + item.cgst_amount + item.sgst_amount + item.igst_amount).toFixed(2)}</div>
                        </div>
                    ))}

                    {/* Filler to maintain height/grid lines if needed */}
                    <div className="flex-1 flex">
                        <div className="w-10 border-r border-black"></div>
                        <div className="flex-1 border-r border-black"></div>
                        <div className="w-20 border-r border-black"></div>
                        <div className="w-12 border-r border-black"></div>
                        <div className="w-20 border-r border-black"></div>
                        <div className="w-24 border-r border-black"></div>
                        <div className="w-32 border-r border-black flex">
                            <div className="w-1/2 border-r border-black"></div>
                            <div className="w-1/2"></div>
                        </div>
                        <div className="w-24"></div>
                    </div>
                </div>

                {/* 7. Total Row */}
                <div className="flex border-b border-black font-bold">
                    <div className="w-10 border-r border-black py-1"></div>
                    <div className="flex-1 text-right px-2 py-1 border-r border-black">Total</div>
                    <div className="w-20 border-r border-black py-1"></div>
                    <div className="w-12 text-center py-1 border-r border-black">{invoice.items.reduce((a, b) => a + b.quantity, 0)} NOS</div>
                    <div className="w-20 border-r border-black py-1"></div>
                    <div className="w-24 text-right px-1 py-1 border-r border-black">{invoice.total_taxable.toFixed(2)}</div>
                    <div className="w-32 text-right px-1 py-1 border-r border-black">{(invoice.total_cgst + invoice.total_sgst + invoice.total_igst).toFixed(2)}</div>
                    <div className="w-24 text-right px-1 py-1">{invoice.grand_total.toFixed(2)}</div>
                </div>

                {/* 8. Footer Section */}
                <div className="grid grid-cols-[1fr_300px] border-black">
                    {/* Left Footer */}
                    <div className="border-r border-black pt-1 px-2 flex flex-col justify-between">
                        <div>
                            <div className="flex text-xs mb-1">
                                <span className="font-bold w-24">Total in words</span>
                                <div className="border-b border-black border-dashed flex-1 uppercase">
                                    {numberToWords(invoice.grand_total)} Only
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="font-bold border-b border-black text-center bg-slate-100 text-[10px] py-0.5">Bank Details</div>
                                <div className="grid grid-cols-[80px_1fr] text-[10px] py-1 gap-y-0.5">
                                    <span className="font-bold">Name</span><span>ICICI Bank</span>
                                    <span className="font-bold">Branch</span><span>Bangalore Main</span>
                                    <span className="font-bold">Acc. Number</span><span>2715500356</span>
                                    <span className="font-bold">IFSC</span><span>ICIC00012</span>
                                    <span className="font-bold">UPI ID</span><span>glasses@icici</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-2 mb-1 flex justify-between items-end">
                            <div className="text-[9px]">
                                <div className="font-bold border-b border-black mb-1 w-24">Terms and Conditions</div>
                                1. Subject to Bangalore Jurisdiction.<br />
                                2. Our Responsibility Ceases as soon as goods leaves premises.<br />
                                3. Goods once sold will not be taken back.<br />
                                4. Delivery Ex-Premises.
                            </div>
                            <div className="flex flex-col items-center">
                                <QrCode size={48} className="text-slate-800" />
                                <span className="text-[9px] font-bold mt-1">Pay using UPI</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Footer */}
                    <div className="flex flex-col">
                        <div className="flex justify-between px-2 py-0.5 border-b border-gray-300 text-[10px]">
                            <span className="font-bold">Taxable Amount</span>
                            <span>{invoice.total_taxable.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between px-2 py-0.5 border-b border-gray-300 text-[10px]">
                            <span className="font-bold">Add : CGST</span>
                            <span>{invoice.total_cgst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between px-2 py-0.5 border-b border-gray-300 text-[10px]">
                            <span className="font-bold">Add : SGST</span>
                            <span>{invoice.total_sgst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between px-2 py-0.5 border-b border-black text-[10px]">
                            <span className="font-bold">Round Off</span>
                            <span>{invoice.round_off.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between px-2 py-1 border-b border-black font-bold text-sm bg-slate-50">
                            <span>Total Amount After Tax</span>
                            <span>₹{invoice.grand_total.toFixed(2)}</span>
                        </div>

                        <div className="text-[10px] text-right px-2 py-0.5 italic border-b border-black">
                            (E & O.E.)
                        </div>

                        <div className="p-1 text-[9px] text-center border-b border-black">
                            Certified that the particulars given above are true and correct.
                        </div>

                        <div className="flex-1 flex flex-col justify-between items-center py-2">
                            <div className="font-bold">For Glasses & Hardwares Ltd</div>
                            <div className="h-8"></div>
                            <div className="border-t border-black w-3/4 text-center text-[9px]">Authorised Signatory</div>
                        </div>
                    </div>
                </div>

                <div className="text-right text-[8px] pr-2 py-1 transform -rotate-1 text-slate-400">
                    This is a computer generated invoice no signature required.
                </div>
            </div>
        </div>
    );
}
