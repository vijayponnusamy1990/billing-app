import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, MapPin, Phone, User, ChevronRight, X, Save, FileText } from "lucide-react";
import { getCustomers, createCustomer, Customer } from "../api/customersApi";
import CustomerForm, { CustomerFormData } from "../components/CustomerForm";
import { useToast } from "../components/Toaster";

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const toast = useToast();

    // New Customer Form State
    const [newCustomerData, setNewCustomerData] = useState<CustomerFormData>({
        name: "",
        phone: "",
        billing_line1: "", billing_line2: "", billing_city: "", billing_state: "", billing_zip: "",
        shipping_line1: "", shipping_line2: "", shipping_city: "", shipping_state: "", shipping_zip: "",
        gstin: "", refer_by: ""
    });

    const fetchCustomers = async () => {
        try {
            const data = await getCustomers(0, 50, searchTerm);
            setCustomers(data);
        } catch (error) {
            console.error("Failed to fetch customers", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchCustomers();
        }, 300);
        return () => clearTimeout(debounce);
    }, [searchTerm]);

    const handleCreate = async () => {
        if (!newCustomerData.name) {
            toast.error("Customer Name is required");
            return;
        }

        try {
            await createCustomer({
                name: newCustomerData.name,
                phone: newCustomerData.phone,
                billing_line1: newCustomerData.billing_line1,
                billing_line2: newCustomerData.billing_line2,
                billing_city: newCustomerData.billing_city,
                billing_state: newCustomerData.billing_state,
                billing_zip: newCustomerData.billing_zip,
                shipping_line1: newCustomerData.shipping_line1,
                shipping_line2: newCustomerData.shipping_line2,
                shipping_city: newCustomerData.shipping_city,
                shipping_state: newCustomerData.shipping_state,
                shipping_zip: newCustomerData.shipping_zip,
                gstin: newCustomerData.gstin,
                refer_by: newCustomerData.refer_by
            });

            toast.success("Customer created successfully!");
            await fetchCustomers();
            setIsAdding(false);
            setNewCustomerData({
                name: "", phone: "",
                billing_line1: "", billing_line2: "", billing_city: "", billing_state: "", billing_zip: "",
                shipping_line1: "", shipping_line2: "", shipping_city: "", shipping_state: "", shipping_zip: "",
                gstin: "", refer_by: ""
            });
        } catch (error) {
            console.error("Failed to create customer", error);
            toast.error("Failed to create customer");
        }
    };

    const handleCreateInvoice = (e: React.MouseEvent, customer: Customer) => {
        e.stopPropagation();
        navigate('/invoices/new', { state: { customer } });
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="page-title">Customers</h1>
                    <p className="sub-text mt-1">Manage your client base.</p>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="btn btn-primary btn-md"
                    >
                        <Plus size={18} strokeWidth={3} /> Add New Customer
                    </button>
                )}
            </div>

            {/* Inline Add Customer Form */}
            {isAdding && (
                <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-2xl shadow-blue-100/50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-black text-slate-900">New Customer Profile</h2>
                        <button
                            onClick={() => setIsAdding(false)}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <CustomerForm
                        data={newCustomerData}
                        onChange={setNewCustomerData}
                        showSearch={false} // Don't show search in "Add New" mode usually, or maybe we do? User said "remove popup... make it similar to Customer Information". 
                    // But if we are adding a NEW customer, we probably don't need autocomplete search for existing ones. 
                    // Wait, existing logic in NewInvoice allowed search. Here we are explicitly adding.
                    // Let's keep showSearch={false} for pure adding.
                    />

                    <div className="mt-8 flex justify-end gap-4 border-t border-slate-100 pt-6">
                        <button
                            onClick={() => setIsAdding(false)}
                            className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-black shadow-xl shadow-blue-200 flex items-center gap-2 active:scale-95 transition-all"
                        >
                            <Save size={20} />
                            Create Customer
                        </button>
                    </div>
                </div>
            )}

            {!isAdding && (
                <>
                    {/* Search Bar */}
                    <div className="relative max-w-md animate-in fade-in duration-500">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            className="input-std pl-10"
                            placeholder="Search customers by name, phone or city..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Customers List */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {isLoading ? (
                            <div className="p-8 text-center text-slate-500">Loading clients...</div>
                        ) : customers.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <User className="text-slate-300" size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">No customers found</h3>
                                <p className="text-slate-500 mt-1">Try a different search term or add a new customer.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {customers.map((customer) => (
                                    <div
                                        key={customer.id}
                                        onClick={() => navigate(`/customers/${customer.id}`)}
                                        className="p-5 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
                                                {customer.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{customer.name}</h3>
                                                <div className="flex items-center gap-4 mt-1 text-sm text-slate-500 font-medium">
                                                    {customer.phone && (
                                                        <div className="flex items-center gap-1">
                                                            <Phone size={14} /> {customer.phone}
                                                        </div>
                                                    )}
                                                    {customer.billing_city && (
                                                        <div className="flex items-center gap-1">
                                                            <MapPin size={14} /> {customer.billing_city}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={(e) => handleCreateInvoice(e, customer)}
                                                className="hidden group-hover:flex btn btn-sm btn-ghost bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 uppercase text-xs"
                                            >
                                                <FileText size={14} /> Create Invoice
                                            </button>
                                            <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" size={20} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
