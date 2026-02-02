import { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { getProducts } from "../api/productsApi";
import { createInvoice, getInvoice, updateInvoice } from "../api/invoicesApi";
import { searchCustomers } from "../api/customersApi"; // Still needed if we use it elsewhere? No, CustomerForm uses it. But wait, `CustomerForm` imports it.
import { Product, Unit, InvoiceItemCreate, Customer, PaymentStatus, PaymentMode } from "../types";
import { Plus, Trash2, Save, ShoppingCart, Calculator, User, Calendar, ChevronDown, ChevronUp, Printer, Package, AlertTriangle, ArrowRight, ArrowLeft, CheckCircle2, Banknote, CreditCard, Wallet, Landmark, FileText, Eye } from "lucide-react";
import Autocomplete from "../components/Autocomplete";
import CustomerForm, { CustomerFormData } from "../components/CustomerForm";
import { useToast } from "../components/Toaster";

export default function NewInvoicePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const toast = useToast();
  const [role] = useState(localStorage.getItem("role") || "SALES");
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<(InvoiceItemCreate & { id_key: string })[]>([]);
  const [step, setStep] = useState(1);

  const [customerData, setCustomerData] = useState<CustomerFormData>({
    name: "",
    phone: "",
    billing_line1: "", billing_line2: "", billing_city: "", billing_state: "", billing_zip: "",
    shipping_line1: "", shipping_line2: "", shipping_city: "", shipping_state: "", shipping_zip: "",
    gstin: "", refer_by: ""
  });

  // Active Entry Row State
  const [activeEntry, setActiveEntry] = useState<{
    productId: string;
    qty: number;
    manualRate: number | null;
  }>({ productId: "", qty: 1, manualRate: null });

  // (Removed shipping sync useEffect as CustomerForm handles it internally)

  const [showTaxes, setShowTaxes] = useState(false);

  // Payment State
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PENDING);
  const [paymentMode, setPaymentMode] = useState<PaymentMode | null>(null);

  useEffect(() => {
    getProducts({ limit: 1000 }).then(setProducts);

    if (id && /^\d+$/.test(id)) {
      getInvoice(Number(id)).then(inv => {
        setCustomerData({
          name: inv.customer?.name || "",
          phone: inv.customer?.phone || "",
          billing_line1: inv.customer?.billing_line1 || "",
          billing_line2: inv.customer?.billing_line2 || "",
          billing_city: inv.customer?.billing_city || "",
          billing_state: inv.customer?.billing_state || "",
          billing_zip: inv.customer?.billing_zip || "",
          shipping_line1: inv.customer?.shipping_line1 || "",
          shipping_line2: inv.customer?.shipping_line2 || "",
          shipping_city: inv.customer?.shipping_city || "",
          shipping_state: inv.customer?.shipping_state || "",
          shipping_zip: inv.customer?.shipping_zip || "",
          gstin: inv.customer?.gstin || "",
          refer_by: inv.customer?.refer_by || ""
        });

        // item mapping
        const mappedItems = inv.items.map(i => ({
          id_key: Math.random().toString(36).substr(2, 9),
          product_id: i.product_id,
          quantity: i.quantity,
          unit: i.unit,
          description: i.description || "",
          thickness: i.thickness,
          dimension: i.dimension,
          manual_rate: i.rate
        }));
        setItems(mappedItems);
        setPaymentStatus(inv.payment_status);
        if (inv.payment_status === PaymentStatus.PAID) {
          setPaymentMode(inv.payment_mode || null);
        }
        setStep(3); // Start at summary
      }).catch(err => {
        toast.error("Failed to load invoice");
        console.error(err);
        navigate('/history');
      })
    }
  }, [id]);

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

  const handleSubmit = async (shouldPrint: boolean, redirectTo?: string) => {
    if (items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    if (!customerData.name || customerData.name.trim() === "") {
      toast.error("Customer name is required");
      return;
    }

    try {

      const payload = {
        invoice_no: `INV-${Date.now()}`, // Note: backend keeps original if updating
        items: items.map(({ id_key, ...rest }) => rest),
        customer_id: undefined,
        customer_name: customerData.name,
        customer_phone: customerData.phone,
        customer_billing_line1: customerData.billing_line1,
        customer_billing_line2: customerData.billing_line2,
        customer_billing_city: customerData.billing_city,
        customer_billing_state: customerData.billing_state,
        customer_billing_zip: customerData.billing_zip,
        customer_shipping_line1: customerData.shipping_line1,
        customer_shipping_line2: customerData.shipping_line2,
        customer_shipping_city: customerData.shipping_city,
        customer_shipping_state: customerData.shipping_state,
        customer_shipping_zip: customerData.shipping_zip,
        customer_gstin: customerData.gstin,
        customer_refer_by: customerData.refer_by,
        payment_status: paymentStatus,
        payment_mode: paymentStatus === PaymentStatus.PAID ? (paymentMode || undefined) : undefined,
      };

      let invoiceId = id ? Number(id) : null;

      if (id) {
        await updateInvoice(Number(id), payload as any); // using as any to bypass strict checks if types slight mismatch
        toast.success("Invoice Updated!");
      } else {
        const created = await createInvoice(payload);
        invoiceId = created.id;
        toast.success("Invoice Created Successfully!");
      }


      const targetPath = redirectTo || `/invoices/${invoiceId}`;
      const query = shouldPrint ? "?print=true" : "";

      navigate(`${targetPath}${query}`);
    } catch (e) {
      console.error(e);
      toast.error("Error creating invoice");
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!customerData.name || customerData.name.trim() === "") {
        toast.error("Customer name is required to proceed");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCustomerSelect = (c: Customer) => {
    setCustomerData({
      name: c.name,
      phone: c.phone || "",
      billing_line1: c.billing_line1 || "",
      billing_line2: c.billing_line2 || "",
      billing_city: c.billing_city || "",
      billing_state: c.billing_state || "",
      billing_zip: c.billing_zip || "",
      shipping_line1: c.shipping_line1 || "",
      shipping_line2: c.shipping_line2 || "",
      shipping_city: c.shipping_city || "",
      shipping_state: c.shipping_state || "",
      shipping_zip: c.shipping_zip || "",
      gstin: c.gstin || "",
      refer_by: c.refer_by || ""
    });
    toast.info("Customer information loaded");
  };

  useEffect(() => {
    if (location.state?.customer) {
      const c = location.state.customer as Customer;
      handleCustomerSelect(c);
      setStep(2);
      // Clean up state to avoid re-triggering on refresh/back
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  return (
    <div className="flex flex-col gap-8 max-w-[1600px] mx-auto pb-20 px-4">
      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-2">
        <div className="flex items-center w-full max-w-xl relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500 ease-out"
              style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
            />
          </div>

          <div className="relative flex justify-between w-full">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${step >= 1 ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-slate-400 border border-slate-100'}`}>
                {step > 1 ? <CheckCircle2 size={16} /> : <User size={16} />}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>Customer</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${step >= 2 ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-slate-400 border border-slate-100'}`}>
                {step > 2 ? <CheckCircle2 size={16} /> : <ShoppingCart size={16} />}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${step >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>Billing</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${step === 3 ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-slate-400 border border-slate-100'}`}>
                <Banknote size={16} />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${step === 3 ? 'text-blue-600' : 'text-slate-400'}`}>Payment</span>
            </div>
          </div>
        </div>
      </div>

      {step === 1 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header & Customer Section (Full Width, Compact) */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-2xl shadow-slate-200/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1"></div>
              <div className="flex items-center gap-4">
                <div className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">
                  Step 1 of 2
                </div>
                <div className="text-xs font-bold text-slate-400">
                  # INV-{Date.now().toString().slice(-6)}
                </div>
              </div>
            </div>

            <CustomerForm
              data={customerData}
              onChange={setCustomerData}
              onSelectExisting={handleCustomerSelect}
              showSearch={true}
            />

            <div className="mt-12 flex justify-end">
              <button
                onClick={nextStep}
                className="group btn btn-lg btn-primary w-full md:w-auto"
              >
                <span>Add Products</span>
                <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-3xl py-4 px-6 shadow-sm">
            <div className="flex items-center gap-6">
              <button
                onClick={prevStep}
                className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl transition-all border border-slate-100"
                title="Go back to customer details"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h3 className="text-xl font-black text-slate-900">{customerData.name}</h3>
                <p className="text-slate-400 font-bold text-xs">{customerData.phone || 'No phone'} • {customerData.billing_city}, {customerData.billing_state}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">Step 2: Products</span>
            </div>
          </div>

          {/* Unified Table-Entry System */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl shadow-slate-200/40 relative">
            <div className="py-4 px-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <Calculator size={24} className="text-blue-600" />
                <span>Invoice Components</span>
              </h2>
            </div>

            <div className="relative">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-12">#</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Product / Description</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-28">HSN</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-32">Qty</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-40">Rate (₹)</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-24">GST</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-44">Row Total</th>
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
                        <td className="px-6 py-3 text-sm font-black text-slate-300">{idx + 1}</td>
                        <td className="px-6 py-3">
                          <div className="font-bold text-slate-900 text-base tracking-tight">{fullName}</div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter ${p.category === 'PLYWOOD' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                              {p.category}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-center text-xs font-bold text-slate-400">{p.hsn_code || '---'}</td>
                        <td className="px-6 py-3 text-center">
                          <input
                            type="number"
                            className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-center font-black text-slate-900 focus:border-blue-500 outline-none text-sm"
                            value={item.quantity}
                            min="1"
                            onChange={(e) => updateItemQty(item.id_key, Number(e.target.value))}
                          />
                        </td>
                        <td className="px-6 py-3 text-right">
                          <div className="text-base font-black text-slate-900">₹{(item.manual_rate || p.price_per_piece || 0).toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <div className="text-xs font-black text-slate-900">{p.gst_rate}%</div>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <div className="text-lg font-black text-slate-900 tracking-tighter">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        </td>
                        <td className="px-6 py-3 text-center">
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
                    <td className="px-6 py-4">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-base font-black shadow-lg shadow-blue-500/30">
                        <Plus size={16} strokeWidth={4} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Autocomplete
                        options={products.map(p => ({
                          id: p.id,
                          label: [p.name, p.thickness, p.dimension].filter(Boolean).join(" "),
                          subLabel: `${p.category} • ₹${p.price_per_piece}/pc`,
                          detail: `Stock: ${p.stock_qty}`,
                          original: p
                        }))}
                        onSelect={(opt) => setActiveEntry({ ...activeEntry, productId: opt.id.toString(), manualRate: null })}
                        placeholder="Search product..."
                        value={activeEntry.productId ? [products.find(p => p.id === Number(activeEntry.productId))?.name, products.find(p => p.id === Number(activeEntry.productId))?.thickness, products.find(p => p.id === Number(activeEntry.productId))?.dimension].filter(Boolean).join(" ") : ""}
                        onChange={() => { }} // Controlled via onSelect
                        dropdownPosition="top"
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="w-full h-10 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-black text-slate-400">
                        {selectedProduct?.hsn_code || '---'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="number"
                        className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-center text-lg font-black text-slate-900 focus:border-blue-500 outline-none transition-all"
                        value={activeEntry.qty || ""}
                        onChange={e => setActiveEntry({ ...activeEntry, qty: Number(e.target.value) })}
                        placeholder="0"
                        min="1"
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(role === 'ADMIN' || role === 'MANAGER') ? (
                        <div className="relative">
                          <input
                            type="number"
                            className="w-full bg-purple-50 border-2 border-purple-100 rounded-xl px-3 py-2 text-right text-lg font-black text-purple-700 focus:border-purple-500 outline-none transition-all placeholder:text-purple-200"
                            value={activeEntry.manualRate || ""}
                            placeholder={selectedProduct?.price_per_piece ? selectedProduct.price_per_piece.toString() : "Rate"}
                            onChange={e => setActiveEntry({ ...activeEntry, manualRate: Number(e.target.value) || null })}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-10 flex items-center justify-end px-4 bg-slate-100 rounded-xl text-lg font-black text-slate-400">
                          ₹{selectedProduct?.price_per_piece || '---'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-xs font-black text-slate-900">{selectedProduct?.gst_rate || 0}%</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-lg font-black text-slate-900 tracking-tighter">
                        ₹{selectedProduct ? calculateItemTotal({
                          product_id: selectedProduct.id,
                          quantity: activeEntry.qty,
                          manual_rate: activeEntry.manualRate !== null ? activeEntry.manualRate : undefined
                        }).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={addItem}
                        disabled={!selectedProduct || activeEntry.qty <= 0}
                        className="w-10 h-10 bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20 active:scale-90 transition-all disabled:bg-slate-200 disabled:shadow-none"
                      >
                        <Plus size={20} strokeWidth={3} />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Dynamic Summary Section */}
            <div className="py-6 px-10 bg-slate-100/50 border-t border-slate-100 backdrop-blur-sm">
              <div className="max-w-md ml-auto space-y-2">
                <div className="flex justify-between text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em]">
                  <span>Taxable Amount</span>
                  <span className="text-slate-900 text-base tracking-tighter font-black">₹{totals.taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                <div
                  className="flex items-center justify-between group cursor-pointer"
                  onClick={() => setShowTaxes(!showTaxes)}
                >
                  <div className="flex items-center gap-2 text-slate-400 group-hover:text-blue-500 transition-colors">
                    {showTaxes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">GST Breakdown</span>
                  </div>
                  <span className="text-slate-900 font-bold tracking-tighter text-sm">₹{(totals.cgst + totals.sgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                {showTaxes && (
                  <div className="space-y-2 py-3 px-6 bg-white rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-2 shadow-sm">
                    <div className="flex justify-between text-[9px] font-bold text-slate-500">
                      <span className="uppercase tracking-widest">CGST (5% of GST)</span>
                      <span className="font-black text-slate-900 tracking-tighter">₹{totals.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-slate-500">
                      <span className="uppercase tracking-widest">SGST (5% of GST)</span>
                      <span className="font-black text-slate-900 tracking-tighter">₹{totals.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                )}

                {Math.abs(roundOff) > 0.001 && (
                  <div className="flex justify-between text-[9px] font-black italic text-slate-400 uppercase tracking-widest">
                    <span>Round Off Difference</span>
                    <span className="font-bold">{roundOff > 0 ? '+' : ''}{roundOff.toFixed(2)}</span>
                  </div>
                )}

                <div className="pt-4 border-t-2 border-slate-200 flex justify-between items-center group">
                  <div className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">
                    Grand Total
                    <div className="text-[9px] font-black text-blue-600 mt-1 tracking-widest">CALCULATED & ROUNDED</div>
                  </div>
                  <div className="text-4xl font-black text-slate-950 tracking-tighter group-hover:scale-105 transition-transform duration-500 drop-shadow-sm">
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Action Buttons Hub */}
                <div className="mt-6">
                  <button
                    onClick={() => setStep(3)}
                    disabled={items.length === 0}
                    className="btn btn-lg btn-primary w-full"
                  >
                    <span>Proceed to Payment</span>
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto w-full">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/50">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setStep(2)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"><ArrowLeft size={20} /></button>
              <h2 className="text-2xl font-black text-slate-900">Payment Details</h2>
            </div>

            <div className="space-y-8">
              {/* Status Toggle */}
              <div className="bg-slate-50 p-1.5 rounded-2xl flex relative">
                <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out ${paymentStatus === PaymentStatus.PAID ? 'translate-x-[calc(100%+6px)]' : 'translate-x-0'}`} />
                <button
                  onClick={() => setPaymentStatus(PaymentStatus.PENDING)}
                  className={`flex-1 py-3 text-sm font-black uppercase tracking-widest relative z-10 transition-colors ${paymentStatus === PaymentStatus.PENDING ? 'text-slate-900' : 'text-slate-400'}`}
                >
                  Pending / Credit
                </button>
                <button
                  onClick={() => setPaymentStatus(PaymentStatus.PAID)}
                  className={`flex-1 py-3 text-sm font-black uppercase tracking-widest relative z-10 transition-colors ${paymentStatus === PaymentStatus.PAID ? 'text-blue-600' : 'text-slate-400'}`}
                >
                  Paid Now
                </button>
              </div>

              {/* Payment Modes */}
              {paymentStatus === PaymentStatus.PAID && (
                <div className="grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
                  {[
                    { id: PaymentMode.CASH, label: 'Cash', icon: Banknote },
                    { id: PaymentMode.UPI, label: 'UPI', icon: Wallet },
                    { id: PaymentMode.CARD, label: 'Card', icon: CreditCard },
                    { id: PaymentMode.NET_BANKING, label: 'Net Bank', icon: Landmark },
                    { id: PaymentMode.CHEQUE, label: 'Cheque', icon: FileText }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setPaymentMode(mode.id)}
                      className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all active:scale-95 ${paymentMode === mode.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
                    >
                      <mode.icon size={24} strokeWidth={2.5} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{mode.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Summary & Action */}
              <div className="pt-8 border-t border-slate-100 mt-8 text-center space-y-6">
                <div>
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Payable</div>
                  <div className="text-4xl font-black text-slate-900">₹{grandTotal.toLocaleString('en-IN')}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleSubmit(false, '/invoices')}
                    disabled={items.length === 0}
                    className="btn btn-lg btn-outline w-full flex items-center justify-center gap-2"
                  >
                    <Save size={20} />
                    <span>Save Only</span>
                  </button>
                  <button
                    onClick={() => handleSubmit(false)}
                    disabled={items.length === 0}
                    className="btn btn-lg btn-secondary w-full flex items-center justify-center gap-2"
                  >
                    <Eye size={20} />
                    <span>Preview PDF</span>
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleSubmit(true)}
                    disabled={items.length === 0}
                    className="btn btn-lg btn-primary w-full flex items-center justify-center gap-3 py-4"
                  >
                    <Printer size={24} />
                    <span className="text-lg">Save and Print</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
