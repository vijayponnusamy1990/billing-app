import { useState, useEffect } from "react";
import { User, MapPin } from "lucide-react";
import Autocomplete from "./Autocomplete";
import { searchCustomers } from "../api/customersApi";
import { Customer } from "../api/customersApi";

export interface CustomerFormData {
    name: string;
    phone: string;
    gstin?: string;
    refer_by?: string;

    billing_line1?: string;
    billing_line2?: string;
    billing_city?: string;
    billing_state?: string;
    billing_zip?: string;

    shipping_line1?: string;
    shipping_line2?: string;
    shipping_city?: string;
    shipping_state?: string;
    shipping_zip?: string;
}

interface CustomerFormProps {
    data: CustomerFormData;
    onChange: (data: CustomerFormData) => void;
    onSelectExisting?: (customer: Customer) => void;
    showSearch?: boolean; // If true, Name/Phone use Autocomplete. If false, simple inputs.
}

export default function CustomerForm({ data, onChange, onSelectExisting, showSearch = true }: CustomerFormProps) {
    const [isShippingSame, setIsShippingSame] = useState(true);

    // Sync shipping with billing if checked
    useEffect(() => {
        if (isShippingSame) {
            onChange({
                ...data,
                shipping_line1: data.billing_line1,
                shipping_line2: data.billing_line2,
                shipping_city: data.billing_city,
                shipping_state: data.billing_state,
                shipping_zip: data.billing_zip,
            });
        }
    }, [
        isShippingSame,
        data.billing_line1,
        data.billing_line2,
        data.billing_city,
        data.billing_state,
        data.billing_zip
    ]);

    // Update internal checkbox if external data changes mismatch (optional, for bidirectional)
    // For now, we trust the component's internal state for the checkbox unless we want to control it.
    // Let's rely on internal state for simplicity as it's UI behavior.

    const handleChange = (field: keyof CustomerFormData, value: string) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-2">
                <div className="space-y-1">
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <User size={20} className="text-blue-600" />
                        <span>Customer Details</span>
                    </h2>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="md:col-span-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Customer Name <span className="text-red-500 font-black">*</span></label>
                    {showSearch ? (
                        <Autocomplete
                            options={[]}
                            placeholder="Type customer name..."
                            inputClassName="input-std"
                            asyncSearch={async (query) => {
                                const results = await searchCustomers(query);
                                return results.map(c => ({
                                    id: c.id,
                                    label: c.name,
                                    subLabel: c.phone || "No phone",
                                    detail: c.gstin,
                                    original: c
                                }));
                            }}
                            onSelect={(opt) => onSelectExisting && onSelectExisting(opt.original as Customer)}
                            value={data.name}
                            onChange={(val) => handleChange("name", val)}
                        />
                    ) : (
                        <input
                            type="text"
                            required
                            className="input-std"
                            value={data.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            placeholder="e.g. Acme Corp"
                        />
                    )}
                </div>
                <div className="md:col-span-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Phone Number</label>
                    {showSearch ? (
                        <Autocomplete
                            options={[]}
                            placeholder="Type phone number..."
                            inputClassName="input-std"
                            asyncSearch={async (query) => {
                                const results = await searchCustomers(query);
                                return results.map(c => ({
                                    id: c.id,
                                    label: c.phone || c.name,
                                    subLabel: c.name,
                                    detail: c.gstin,
                                    original: c
                                }));
                            }}
                            onSelect={(opt) => onSelectExisting && onSelectExisting(opt.original as Customer)}
                            value={data.phone}
                            onChange={(val) => handleChange("phone", val)}
                        />
                    ) : (
                        <input
                            type="tel"
                            className="input-std"
                            value={data.phone}
                            onChange={(e) => handleChange("phone", e.target.value)}
                            placeholder="+91..."
                        />
                    )}
                </div>

                <div className="md:col-span-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">GSTIN (Optional)</label>
                    <input
                        type="text"
                        className="input-std"
                        value={data.gstin || ""}
                        onChange={(e) => handleChange("gstin", e.target.value)}
                        placeholder="GSTIN"
                    />
                </div>
                <div className="md:col-span-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Refer By</label>
                    <input
                        type="text"
                        className="input-std"
                        value={data.refer_by || ""}
                        onChange={(e) => handleChange("refer_by", e.target.value)}
                        placeholder="Reference"
                    />
                </div>
            </div>

            <div className="h-px bg-slate-100 my-4" />

            {/* Address Section */}
            <div className="space-y-4">
                <div className="flex justify-between items-center ml-1">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-blue-50 text-blue-600 rounded flex items-center justify-center font-black text-[9px]">A</div>
                        <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest">Billing Address</label>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer group bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-400 transition-all">
                        <input type="checkbox" checked={isShippingSame} onChange={e => setIsShippingSame(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 border-slate-300 transition-all" />
                        <span className="text-[10px] font-black text-slate-500 group-hover:text-blue-600 transition-colors uppercase tracking-tight">Shipping Same as Billing</span>
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-1">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Street / Area (Line 1)</label>
                        <input
                            type="text" placeholder="Address Line 1"
                            className="input-std"
                            value={data.billing_line1 || ""} onChange={e => handleChange("billing_line1", e.target.value)}
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Landmark (Line 2)</label>
                        <input
                            type="text" placeholder="Address Line 2"
                            className="input-std"
                            value={data.billing_line2 || ""} onChange={e => handleChange("billing_line2", e.target.value)}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">City</label>
                                <input
                                    type="text" placeholder="City"
                                    className="input-std"
                                    value={data.billing_city || ""} onChange={e => handleChange("billing_city", e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">State</label>
                                <input
                                    type="text" placeholder="State"
                                    className="input-std"
                                    value={data.billing_state || ""} onChange={e => handleChange("billing_state", e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Pincode</label>
                                <input
                                    type="text" placeholder="Zip Code"
                                    className="input-std"
                                    value={data.billing_zip || ""} onChange={e => handleChange("billing_zip", e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {!isShippingSame && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-300 pt-4">
                        <div className="flex items-center gap-2 mb-4 ml-1">
                            <div className="w-5 h-5 bg-blue-50 text-blue-600 rounded flex items-center justify-center font-black text-[9px]">S</div>
                            <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest">Shipping Address</label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-1">
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Street / Area (Line 1)</label>
                                <input
                                    type="text" placeholder="Address Line 1"
                                    className="input-std"
                                    value={data.shipping_line1 || ""} onChange={e => handleChange("shipping_line1", e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Landmark (Line 2)</label>
                                <input
                                    type="text" placeholder="Address Line 2"
                                    className="input-std"
                                    value={data.shipping_line2 || ""} onChange={e => handleChange("shipping_line2", e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">City</label>
                                        <input
                                            type="text" placeholder="City"
                                            className="input-std"
                                            value={data.shipping_city || ""} onChange={e => handleChange("shipping_city", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">State</label>
                                        <input
                                            type="text" placeholder="State"
                                            className="input-std"
                                            value={data.shipping_state || ""} onChange={e => handleChange("shipping_state", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Pincode</label>
                                        <input
                                            type="text" placeholder="Zip"
                                            className="input-std"
                                            value={data.shipping_zip || ""} onChange={e => handleChange("shipping_zip", e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
