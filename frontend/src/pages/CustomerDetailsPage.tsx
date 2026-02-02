import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, User, Phone, MapPin, FileText, Calendar, DollarSign, Clock, ArrowRight, CheckCircle2, AlertCircle, Edit, Save, X } from "lucide-react";
import { getCustomer, getCustomerInvoices, updateCustomer, Customer } from "../api/customersApi";
import { PaymentStatus } from "../types";
import CustomerForm, { CustomerFormData } from "../components/CustomerForm";
import { useToast } from "../components/Toaster";

export default function CustomerDetailsPage() {
    const { id } = useParams();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<CustomerFormData | null>(null);

    const navigate = useNavigate();
    const toast = useToast();

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
                toast.error("Failed to load customer details");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleCreateInvoice = () => {
        if (!customer) return;
        navigate('/billing/new', { state: { customer } });
    };

    const startEditing = () => {
        if (!customer) return;
        setEditData({
            name: customer.name,
            phone: customer.phone || "",
            billing_line1: customer.billing_line1 || "",
            billing_line2: customer.billing_line2 || "",
            billing_city: customer.billing_city || "",
            billing_state: customer.billing_state || "",
            billing_zip: customer.billing_zip || "",
            shipping_line1: customer.shipping_line1 || "",
            shipping_line2: customer.shipping_line2 || "",
            shipping_city: customer.shipping_city || "",
            shipping_state: customer.shipping_state || "",
            shipping_zip: customer.shipping_zip || "",
            gstin: customer.gstin || "",
            refer_by: customer.refer_by || ""
        });
        setIsEditing(true);
    };

    const saveChanges = async () => {
        if (!customer || !editData || !id) return;

        if (!editData.name.trim()) {
            toast.error("Name is required");
            return;
        }

        try {
            await updateCustomer(Number(id), editData);
            toast.success("Customer updated successfully");

            // Refresh customer data
            const updated = await getCustomer(Number(id));
            setCustomer(updated);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update customer", error);
            toast.error("Failed to update customer");
        }
    };

    if (isLoading) {
        return <div className="p-12 text-center text-slate-500">Loading details...</div>;
    }

    if (!customer) {
        return <div className="p-12 text-center">Customer not found.</div>;
    }

    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.grand_total || 0), 0);

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            <Link to="/customers" className="inline-flex items-center text-slate-500 hover:text-blue-600 font-bold text-sm transition-colors mb-4">
                <ArrowLeft size={16} className="mr-1" /> Back to Customers
            </Link>

            {/* Profile Header or Edit Form */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 relative overflow-hidden transition-all duration-300">
                {!isEditing ? (
                    <>
                        <div className="absolute top-0 right-0 p-8 opacity-5"><User size={120} /></div>
                        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-blue-500/30">
                                {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 w-full">
                                <div className="flex justify-between items-start">
                                    <h1 className="text-3xl font-black text-slate-900">{customer.name}</h1>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={startEditing}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100"
                                            title="Edit Profile"
                                        >
                                            <Edit size={20} />
                                        </button>
                                        <button
                                            onClick={handleCreateInvoice}
                                            className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all border border-transparent hover:border-green-100"
                                            title="New Invoice"
                                        >
                                            <DollarSign size={20} />
                                        </button>
                                    </div>
                                </div>
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

                                {customer.gstin && (
                                    <div className="mt-4 pt-4 border-t border-slate-50 flex gap-6">
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">GSTIN</div>
                                            <div className="font-bold text-slate-700">{customer.gstin}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-2 min-w-[150px]">
                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Lifetime Value</div>
                                    <div className="text-2xl font-black text-emerald-600">₹{totalRevenue.toLocaleString('en-IN')}</div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
                            <h2 className="text-xl font-black text-slate-900">Edit Customer Profile</h2>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {editData && (
                            <CustomerForm
                                data={editData}
                                onChange={setEditData}
                                showSearch={false}
                            />
                        )}

                        <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveChanges}
                                className="btn btn-primary flex items-center gap-2"
                            >
                                <Save size={18} />
                                <span>Save Changes</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Invoice History */}
            {!isEditing && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
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
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${inv.payment_status === PaymentStatus.PAID
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                        : 'bg-orange-50 text-orange-700 border-orange-100'
                                                        }`}>
                                                        {inv.payment_status === PaymentStatus.PAID ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                                        {inv.payment_status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-slate-900 text-right">
                                                    ₹{inv.grand_total.toLocaleString('en-IN')}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <Link
                                                        to={`/billing/${inv.id}`}
                                                        className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="View/Edit Invoice"
                                                    >
                                                        <ArrowRight size={18} strokeWidth={2.5} />
                                                        <span className="text-xs font-bold underline">Open</span>
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
            )}
        </div>
    );
}
