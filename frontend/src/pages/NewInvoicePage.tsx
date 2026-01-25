import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts } from "../api/productsApi";
import { createInvoice } from "../api/invoicesApi";
import { Product, Unit, InvoiceItemCreate } from "../types";
import { Plus, Trash2, Save, ShoppingCart, Calculator, User, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import Autocomplete from "../components/Autocomplete";

export default function NewInvoicePage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<InvoiceItemCreate[]>([]);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  // Address fields
  const [addrLine1, setAddrLine1] = useState("");
  const [addrLine2, setAddrLine2] = useState("");
  const [city, setCity] = useState("");

  const [showTaxes, setShowTaxes] = useState(false);

  // Current Item State - Simplified to pieces only
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [qty, setQty] = useState<number>(1);

  useEffect(() => {
    getProducts().then(setProducts);
  }, []);

  const selectedProduct = products.find(p => p.id === Number(selectedProductId));

  const calculateItemTotal = (item: InvoiceItemCreate, product: Product) => {
    const taxable = calculateItemTaxable(item, product);
    const gstRate = product.gst_rate || 0;
    return taxable * (1 + gstRate / 100);
  };

  const calculateItemTaxable = (item: InvoiceItemCreate, product: Product) => {
    return item.quantity * (product.price_per_piece || 0);
  };

  const addItem = () => {
    if (!selectedProduct || qty <= 0) return;

    const newItem: InvoiceItemCreate = {
      product_id: selectedProduct.id,
      quantity: qty,
      unit: Unit.PIECE, // Always piece
      length_ft: undefined,
      width_ft: undefined,
      area_sqft: undefined,
      thickness: selectedProduct.thickness,
      dimension: selectedProduct.dimension,
      description: selectedProduct.name
    };

    setItems([...items, newItem]);

    // Reset all fields and close the product panel
    setSelectedProductId("");
    setQty(1);
  };

  const removeItem = (idx: number) => {
    const newItems = [...items];
    newItems.splice(idx, 1);
    setItems(newItems);
  };

  const totals = items.reduce((acc, item) => {
    const p = products.find(prod => prod.id === item.product_id);
    if (!p) return acc;
    const taxable = calculateItemTaxable(item, p);
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

  const handleSubmit = async () => {
    if (items.length === 0) {
      alert("Please add at least one item to the invoice");
      return;
    }

    if (!customerName || customerName.trim() === "") {
      alert("Customer name is required");
      return;
    }

    try {
      const fullAddress = [addrLine1, addrLine2, city].filter(Boolean).join(", ");
      const createdInvoice = await createInvoice({
        invoice_no: `INV-${Date.now()}`,
        items: items,
        customer_id: undefined, // Let backend create new customer
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: fullAddress,
        customer_gstin: customerGstin,
        // date: removed, allow backend to set it
      });
      alert("Invoice Created Successfully!");
      navigate(`/invoices/${createdInvoice.id}?print=true`);
    } catch (e) {
      console.error(e);
      alert("Error creating invoice");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Section: Customer Details */}
      <div className="card">
        <div className="mb-4 border-b border-slate-100 pb-2">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <User size={18} className="text-blue-600" /> Customer Details
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Customer Name <span className="text-red-500">*</span></label>
            <input
              type="text" placeholder="Walk-in Customer" className="input-field"
              value={customerName} onChange={e => setCustomerName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
            <input
              type="text" placeholder="98765..." className="input-field"
              value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address Line 1</label>
            <input
              type="text" placeholder="Shop/Flat No, Street" className="input-field"
              value={addrLine1} onChange={e => setAddrLine1(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address Line 2</label>
            <input
              type="text" placeholder="Area/Locality" className="input-field"
              value={addrLine2} onChange={e => setAddrLine2(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">City</label>
            <input
              type="text" placeholder="City" className="input-field"
              value={city} onChange={e => setCity(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Customer GSTIN</label>
            <input
              type="text" placeholder="29XXXXX..." className="input-field"
              value={customerGstin} onChange={e => setCustomerGstin(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Merged Items Widget */}
      <div className="card p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Calculator size={24} className="text-blue-600" /> Invoice Items
              </h2>
              <p className="text-sm text-slate-500 mt-1">{items.length} item{items.length !== 1 ? 's' : ''} added</p>
            </div>
          </div>
        </div>

        {/* Search & Entry Section */}
        <div className="p-6 border-b border-slate-50">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Search Product to Add</label>
            <Autocomplete
              options={products.map(p => {
                const label = [p.name, p.thickness, p.dimension].filter(Boolean).join(" ");
                const priceText = `₹${p.price_per_piece}/pc`;

                return {
                  id: p.id,
                  label: label,
                  subLabel: `${p.category} • ${priceText}`,
                  detail: `Stock: ${p.stock_qty}`,
                  original: p
                };
              })}
              onSelect={(opt) => setSelectedProductId(opt.id.toString())}
              placeholder="Type product name, thickness, or category..."
            />
          </div>

          {/* Selected Product Details Panel */}
          {selectedProduct && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${selectedProduct.category === 'PLYWOOD' ? 'bg-amber-200 text-amber-800' :
                      selectedProduct.category === 'GLASS' ? 'bg-blue-200 text-blue-800' :
                        'bg-slate-200 text-slate-800'
                      }`}>
                      {selectedProduct.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">
                    {[selectedProduct.name, selectedProduct.thickness, selectedProduct.dimension].filter(Boolean).join(" ")}
                  </h3>
                  <p className="text-sm text-slate-600">Stock Available: {selectedProduct.stock_qty} Pieces</p>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Price</div>
                  <div className="text-3xl font-bold text-blue-700">
                    ₹{selectedProduct.price_per_piece}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">per Piece</div>
                </div>
              </div>

              {/* Quantity Input */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Quantity (Pieces)</label>
                <input
                  type="number"
                  className="input-field text-2xl font-bold text-center"
                  placeholder="0"
                  min="1"
                  value={qty || ''}
                  onChange={e => setQty(Number(e.target.value))}
                />
              </div>

              {/* Item Total */}
              <div className="bg-white rounded-lg p-4 mb-4 border-2 border-blue-300">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-600">Item Total (incl. GST):</span>
                  <span className="text-3xl font-bold text-green-600">
                    ₹{calculateItemTotal({
                      product_id: selectedProduct.id,
                      quantity: qty,
                      unit: Unit.PIECE,
                    } as InvoiceItemCreate, selectedProduct).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Add Button */}
              <button
                onClick={addItem}
                disabled={!selectedProduct || qty <= 0}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl shadow-lg shadow-green-600/30 hover:shadow-green-600/50 disabled:from-slate-300 disabled:to-slate-400 disabled:shadow-none font-bold text-lg flex justify-center items-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none"
              >
                <Plus size={24} strokeWidth={3} />
                Add to Invoice
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="table-th pl-6 text-left">Item</th>
                <th className="table-th text-center w-32">Quantity</th>
                <th className="table-th text-right w-32">Total</th>
                <th className="table-th w-16"></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-400">
                    <Calculator size={48} className="mx-auto mb-3 opacity-20" />
                    <p>No items added yet</p>
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => {
                  const p = products.find(prod => prod.id === item.product_id);
                  if (!p) return null;
                  const total = calculateItemTotal(item, p);
                  const fullName = [p.name, p.thickness, p.dimension].filter(Boolean).join(" ");

                  return (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="table-td pl-6">
                        <div className="font-semibold text-slate-800">{fullName}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${p.category === 'PLYWOOD' ? 'bg-amber-100 text-amber-700' :
                            p.category === 'GLASS' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                            {p.category}
                          </span>
                        </div>
                      </td>
                      <td className="table-td text-center">
                        <div className="text-lg font-bold text-slate-800">{item.quantity}</div>
                        <div className="text-[9px] text-slate-400 uppercase tracking-wider">Pieces</div>
                      </td>
                      <td className="table-td text-right">
                        <div className="text-lg font-bold text-green-600">₹{total.toFixed(2)}</div>
                      </td>
                      <td className="table-td pr-6 text-right">
                        <button
                          onClick={() => removeItem(idx)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 border-t-2 border-slate-200">
          <div className="max-w-md ml-auto space-y-3">
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Taxable Amount</span>
              <span className="font-mono">₹{totals.taxable.toFixed(2)}</span>
            </div>

            <div
              className="flex justify-between items-center text-slate-500 cursor-pointer hover:text-blue-600 transition-colors py-2 px-3 rounded-lg hover:bg-white/50"
              onClick={() => setShowTaxes(!showTaxes)}
            >
              <div className="flex items-center gap-2">
                {showTaxes ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                <span className="text-sm font-medium">GST Details</span>
              </div>
              <span className="font-mono text-sm">₹{(totals.cgst + totals.sgst).toFixed(2)}</span>
            </div>

            {showTaxes && (
              <div className="pl-6 space-y-2 bg-white/60 p-3 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>CGST</span>
                  <span className="font-mono">₹{totals.cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>SGST</span>
                  <span className="font-mono">₹{totals.sgst.toFixed(2)}</span>
                </div>
              </div>
            )}

            {Math.abs(roundOff) > 0.001 && (
              <div className="flex justify-between text-slate-400 italic text-sm">
                <span>Round Off</span>
                <span className="font-mono">{roundOff > 0 ? '+' : ''}{roundOff.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t-2 border-slate-300">
              <span className="text-xl font-bold text-slate-800">Grand Total</span>
              <span className="text-4xl font-bold text-green-600 font-mono">₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={items.length === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 disabled:from-slate-300 disabled:to-slate-400 disabled:shadow-none font-bold text-xl flex justify-center items-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none mt-4"
            >
              <Save size={24} strokeWidth={3} />
              Save & Generate Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
