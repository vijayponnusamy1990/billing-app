import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts } from "../api/productsApi";
import { createInvoice } from "../api/invoicesApi";
import { searchCustomers } from "../api/customersApi";
import { Product, Unit, InvoiceItemCreate, Customer } from "../types";
import { Plus, Trash2, Save, ShoppingCart, Calculator, User, Calendar, ChevronDown, ChevronUp, Printer, Package, AlertTriangle } from "lucide-react";
import Autocomplete from "../components/Autocomplete";
import { useToast } from "../components/Toaster";

export default function NewInvoicePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [role] = useState(localStorage.getItem("role") || "SALES");
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<(InvoiceItemCreate & { id_key: string })[]>([]);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [isShippingSame, setIsShippingSame] = useState(true);

  // Active Entry Row State
  const [activeEntry, setActiveEntry] = useState<{
    productId: string;
    qty: number;
    manualRate: number | null;
  }>({ productId: "", qty: 1, manualRate: null });

  useEffect(() => {
    if (isShippingSame) {
      setShippingAddress(billingAddress);
    }
  }, [isShippingSame, billingAddress]);

  const [showTaxes, setShowTaxes] = useState(false);

  useEffect(() => {
    getProducts().then(setProducts);
  }, []);

  const selectedProduct = products.find(p => p.id === Number(activeEntry.productId));

  const calculateItemTaxable = (item: { quantity: number; manual_rate?: number; product_id: number }) => {
    const p = products.find(prod => prod.id === item.product_id);
    if (!p) return 0;
    const rate = item.manual_rate !== undefined ? item.manual_rate : (p.price_per_piece || 0);
    return item.quantity * rate;
  };

  const calculateItemTotal = (item: { quantity: number; manual_rate?: number; product_id: number }) => {
    const p = products.find(prod => prod.id === item.product_id);
    if (!p) return 0;
    const taxable = calculateItemTaxable(item);
    const gstRate = p.gst_rate || 0;
    return taxable * (1 + gstRate / 100);
  };

  const addItem = () => {
    if (!selectedProduct || activeEntry.qty <= 0) {
      toast.error("Please select a product and quantity");
      return;
    }

    if (activeEntry.qty > selectedProduct.stock_qty) {
      toast.error(`Insufficient stock! Available: ${selectedProduct.stock_qty}`);
      return;
    }

    const newItem = {
      id_key: Date.now().toString(),
      product_id: selectedProduct.id,
      quantity: activeEntry.qty,
      unit: selectedProduct.base_unit,
      description: selectedProduct.name,
      thickness: selectedProduct.thickness,
      dimension: selectedProduct.dimension,
      manual_rate: activeEntry.manualRate !== null ? activeEntry.manualRate : undefined
    };

    setItems([...items, newItem]);
    setActiveEntry({ productId: "", qty: 1, manualRate: null });
  };

  const removeItem = (idKey: string) => {
    setItems(items.filter(it => it.id_key !== idKey));
  };

  const updateItemQty = (idKey: string, newQty: number) => {
    setItems(items.map(it => it.id_key === idKey ? { ...it, quantity: newQty } : it));
  };

  const totals = items.reduce((acc, item) => {
    const p = products.find(prod => prod.id === item.product_id);
    if (!p) return acc;
    const taxable = calculateItemTaxable(item);
    const gstRate = p.gst_rate || 0;
    const cgst = (taxable * (gstRate / 2)) / 100;
    const sgst = (taxable * (gstRate / 2)) / 100;

    acc.taxable += taxable;
    acc.cgst += cgst;
    acc.sgst += sgst;
    acc.total += taxable + cgst + sgst;
    return acc;
  }, { taxable: 0, cgst: 0, sgst: 0, total: 0 });

  const grandTotal = Math.round(totals.total);
  const roundOff = grandTotal - totals.total;

  const handleSubmit = async (shouldPrint: boolean) => {
    if (items.length === 0) {
      toast.error("Please add at least one item to the invoice");
      return;
    }

    if (!customerName || customerName.trim() === "") {
      toast.error("Customer name is required");
      return;
    }

    try {
      const finalShippingAddress = isShippingSame ? billingAddress : shippingAddress;

      const createdInvoice = await createInvoice({
        invoice_no: `INV-${Date.now()}`,
        items: items.map(({ id_key, ...rest }) => rest),
        customer_id: undefined,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: billingAddress,
        customer_billing_address: billingAddress,
        customer_shipping_address: finalShippingAddress,
        customer_gstin: customerGstin,
      });
      toast.success("Invoice Created Successfully!");
      if (shouldPrint) {
        navigate(`/invoices/${createdInvoice.id}?print=true`);
      } else {
        navigate(`/invoices/${createdInvoice.id}`);
      }
    } catch (e) {
      console.error(e);
      toast.error("Error creating invoice");
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-20">
      {/* Header & Customer Section (Full Width, Compact) */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-xl shadow-slate-200/50">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <User size={24} className="text-blue-600" />
            <span>Customer Details</span>
          </h2>
          <div className="flex items-center gap-4">
            <div className="px-4 py-1.5 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">
              Draft
            </div>
            <div className="text-sm font-bold text-slate-400">
              # INV-{Date.now().toString().slice(-6)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div className="md:col-span-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Phone / Search</label>
            <Autocomplete
              options={[]}
              placeholder="99999..."
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
              onSelect={(opt) => {
                const c = opt.original as Customer;
                setCustomerName(c.name);
                setCustomerPhone(c.phone || "");
                const addr = c.billing_address || c.address || "";
                setBillingAddress(addr);
                if (c.shipping_address) {
                  setShippingAddress(c.shipping_address);
                  setIsShippingSame(false);
                } else {
                  setShippingAddress(addr);
                  setIsShippingSame(true);
                }
                setCustomerGstin(c.gstin || "");
                toast.info("Customer loaded");
              }}
              value={customerPhone}
              onChange={(val) => setCustomerPhone(val)}
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Customer Name</label>
            <input
              type="text" placeholder="Full Name" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-slate-900 font-bold focus:bg-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
              value={customerName} onChange={e => setCustomerName(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-2 ml-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing Address</label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={isShippingSame} onChange={e => setIsShippingSame(e.target.checked)} className="rounded-md text-blue-600 focus:ring-blue-500 h-4 w-4 border-slate-300 transition-all" />
                <span className="text-[10px] font-black text-slate-400 group-hover:text-blue-500 transition-colors uppercase tracking-tight">Shipping Same</span>
              </label>
            </div>
            <input
              type="text" placeholder="Complete address..." className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-slate-900 font-bold focus:bg-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
              value={billingAddress} onChange={e => setBillingAddress(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Unified Table-Entry System */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-2xl shadow-slate-200/40">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <Calculator size={24} className="text-blue-600" />
            <span>Invoice Components</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-12">#</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Product / Description</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-28">HSN</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-32">Qty</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-40">Rate (₹)</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-24">GST</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-44">Row Total</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-20"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const p = products.find(prod => prod.id === item.product_id);
                if (!p) return null;
                const total = calculateItemTotal(item);
                const taxable = calculateItemTaxable(item);
                const fullName = [p.name, p.thickness, p.dimension].filter(Boolean).join(" ");

                return (
                  <tr key={item.id_key} className="border-b border-slate-50 group hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-6 text-sm font-black text-slate-300">{idx + 1}</td>
                    <td className="px-6 py-6">
                      <div className="font-bold text-slate-900 text-lg tracking-tight">{fullName}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${p.category === 'PLYWOOD' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                          {p.category}
                        </span>
                        {item.manual_rate !== undefined && (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter bg-purple-100 text-purple-600 border border-purple-200">
                            Overridden Rate
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center text-sm font-bold text-slate-400">{p.hsn_code || '---'}</td>
                    <td className="px-6 py-6 text-center">
                      <input
                        type="number"
                        className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-center font-black text-slate-900 focus:border-blue-500 outline-none"
                        value={item.quantity}
                        min="1"
                        onChange={(e) => updateItemQty(item.id_key, Number(e.target.value))}
                      />
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="text-lg font-black text-slate-900">₹{(item.manual_rate || p.price_per_piece || 0).toLocaleString()}</div>
                      <div className="text-[10px] font-bold text-slate-400 tracking-tighter italic">Base: ₹{p.price_per_piece}</div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="text-xs font-black text-slate-900">{p.gst_rate}%</div>
                      <div className="text-[9px] font-bold text-slate-400 tracking-tighter">₹{(total - taxable).toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="text-xl font-black text-slate-900 tracking-tighter">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <button
                        onClick={() => removeItem(item.id_key)}
                        className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                        title="Remove Item"
                      >
                        <Trash2 size={20} className="hidden group-hover:block" />
                        <span className="text-2xl font-black group-hover:hidden">-</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* Inline Entry Row */}
              <tr className="bg-slate-50/50">
                <td className="px-6 py-10">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-500/30">
                    <Plus size={20} strokeWidth={4} />
                  </div>
                </td>
                <td className="px-6 py-10">
                  <Autocomplete
                    options={products.map(p => ({
                      id: p.id,
                      label: [p.name, p.thickness, p.dimension].filter(Boolean).join(" "),
                      subLabel: `${p.category} • ₹${p.price_per_piece}/pc`,
                      detail: `Stock: ${p.stock_qty}`,
                      original: p
                    }))}
                    onSelect={(opt) => setActiveEntry({ ...activeEntry, productId: opt.id.toString(), manualRate: null })}
                    placeholder="Search product to add..."
                    value={activeEntry.productId ? [products.find(p => p.id === Number(activeEntry.productId))?.name, products.find(p => p.id === Number(activeEntry.productId))?.thickness, products.find(p => p.id === Number(activeEntry.productId))?.dimension].filter(Boolean).join(" ") : ""}
                    onChange={() => { }} // Controlled via onSelect
                    dropdownPosition="top"
                  />
                  {selectedProduct && (
                    <div className="mt-2 flex items-center gap-4 animate-in fade-in slide-in-from-left-2 transition-all">
                      <div className="flex items-center gap-1 text-[10px] font-black text-slate-400">
                        <Package size={12} className="text-blue-500" />
                        <span>STOCK: <span className={selectedProduct.stock_qty < 10 ? 'text-red-500' : 'text-slate-900'}>{selectedProduct.stock_qty} PCS</span></span>
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-6 py-10 text-center">
                  <div className="w-full h-12 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black text-slate-400">
                    {selectedProduct?.hsn_code || '---'}
                  </div>
                </td>
                <td className="px-6 py-10 text-center">
                  <input
                    type="number"
                    className="w-full bg-white border-2 border-slate-200 rounded-2xl px-4 py-3 text-center text-xl font-black text-slate-900 focus:border-blue-500 outline-none transition-all"
                    value={activeEntry.qty || ""}
                    onChange={e => setActiveEntry({ ...activeEntry, qty: Number(e.target.value) })}
                    placeholder="0"
                    min="1"
                  />
                </td>
                <td className="px-6 py-10 text-right">
                  {(role === 'ADMIN' || role === 'MANAGER') ? (
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full bg-purple-50 border-2 border-purple-100 rounded-2xl px-4 py-3 text-right text-xl font-black text-purple-700 focus:border-purple-500 outline-none transition-all placeholder:text-purple-200"
                        value={activeEntry.manualRate || ""}
                        placeholder={selectedProduct?.price_per_piece ? selectedProduct.price_per_piece.toString() : "Rate"}
                        onChange={e => setActiveEntry({ ...activeEntry, manualRate: Number(e.target.value) || null })}
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-purple-300 uppercase tracking-tighter">Override</div>
                    </div>
                  ) : (
                    <div className="w-full h-12 flex items-center justify-end px-4 bg-slate-100 rounded-2xl text-lg font-black text-slate-400">
                      ₹{selectedProduct?.price_per_piece || '---'}
                    </div>
                  )}
                </td>
                <td className="px-6 py-10 text-center">
                  <div className="text-xs font-black text-slate-900">{selectedProduct?.gst_rate || 0}%</div>
                </td>
                <td className="px-6 py-10 text-right">
                  <div className="text-xl font-black text-slate-900 tracking-tighter">
                    ₹{selectedProduct ? calculateItemTotal({
                      product_id: selectedProduct.id,
                      quantity: activeEntry.qty,
                      manual_rate: activeEntry.manualRate !== null ? activeEntry.manualRate : undefined
                    }).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                  </div>
                </td>
                <td className="px-6 py-10 text-center">
                  <button
                    onClick={addItem}
                    disabled={!selectedProduct || activeEntry.qty <= 0}
                    className="w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20 active:scale-90 transition-all disabled:bg-slate-200 disabled:shadow-none"
                  >
                    <Plus size={24} strokeWidth={3} />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Dynamic Summary Section */}
        <div className="p-10 bg-slate-50 border-t border-slate-100">
          <div className="max-w-md ml-auto space-y-4">
            <div className="flex justify-between text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">
              <span>Taxable Amount</span>
              <span className="text-slate-900 text-lg tracking-tighter">₹{totals.taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>

            <div
              className="flex items-center justify-between group cursor-pointer"
              onClick={() => setShowTaxes(!showTaxes)}
            >
              <div className="flex items-center gap-2 text-slate-400 group-hover:text-blue-500 transition-colors">
                {showTaxes ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">GST Breakdown</span>
              </div>
              <span className="text-slate-900 font-bold tracking-tighter">₹{(totals.cgst + totals.sgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>

            {showTaxes && (
              <div className="space-y-2 py-3 px-6 bg-white rounded-3xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-500">
                  <span className="uppercase tracking-widest">CGST (50% of GST)</span>
                  <span className="font-black text-slate-900 tracking-tighter">₹{totals.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-500">
                  <span className="uppercase tracking-widest">SGST (50% of GST)</span>
                  <span className="font-black text-slate-900 tracking-tighter">₹{totals.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}

            {Math.abs(roundOff) > 0.001 && (
              <div className="flex justify-between text-[10px] font-black italic text-slate-400 uppercase tracking-widest">
                <span>Round Off Difference</span>
                <span className="font-bold">{roundOff > 0 ? '+' : ''}{roundOff.toFixed(2)}</span>
              </div>
            )}

            <div className="pt-6 border-t-4 border-slate-900 flex justify-between items-center group">
              <div className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                Grand Total
                <div className="text-xs font-bold text-slate-400 mt-1 normal-case tracking-normal">Fully calculated & rounded</div>
              </div>
              <div className="text-5xl font-black text-slate-950 tracking-tighter group-hover:scale-105 transition-transform duration-500">
                ₹{grandTotal.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Action Buttons Hub */}
            <div className="grid grid-cols-2 gap-4 mt-10">
              <button
                onClick={() => handleSubmit(false)}
                disabled={items.length === 0}
                className="bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800 py-4 rounded-3xl font-black text-sm uppercase tracking-widest flex justify-center items-center gap-2 transition-all shadow-lg shadow-slate-100 hover:shadow-slate-200 active:scale-95 disabled:opacity-50"
              >
                <Save size={20} /> Save Draft
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={items.length === 0}
                className="bg-slate-900 text-white hover:bg-black py-4 rounded-3xl font-black text-sm uppercase tracking-widest flex justify-center items-center gap-2 transition-all shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-50"
              >
                <Printer size={20} /> Generate Invoice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
