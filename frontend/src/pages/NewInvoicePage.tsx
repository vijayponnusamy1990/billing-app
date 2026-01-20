import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts } from "../api/productsApi";
import { createInvoice } from "../api/invoicesApi";
import { Product, Unit, InvoiceItemCreate } from "../types";
import { Plus, Trash2, Save, ShoppingCart, Calculator, User, Calendar } from "lucide-react";

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

  // Current Item State
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [qty, setQty] = useState<number>(1);
  const [length, setLength] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);
  const [unit, setUnit] = useState<Unit>(Unit.PIECE);

  useEffect(() => {
    getProducts().then(setProducts);
  }, []);

  const selectedProduct = products.find(p => p.id === Number(selectedProductId));

  // Auto-set unit when product changes
  useEffect(() => {
    if (selectedProduct) {
      setUnit(selectedProduct.base_unit);
    }
  }, [selectedProduct]);

  const calculateItemTotal = (item: InvoiceItemCreate, product: Product) => {
    if (item.unit === Unit.SQFT) {
      const area = item.area_sqft || (item.length_ft || 0) * (item.width_ft || 0);
      return area * (product.price_per_sqft || 0);
    } else {
      return item.quantity * (product.price_per_piece || 0);
    }
  };

  const addItem = () => {
    if (!selectedProduct) return;

    let area_sqft = 0;
    if (unit === Unit.SQFT) {
      area_sqft = length * width;
    }

    const newItem: InvoiceItemCreate = {
      product_id: selectedProduct.id,
      quantity: qty,
      unit: unit,
      length_ft: length,
      width_ft: width,
      area_sqft: area_sqft,
      description: selectedProduct.name
    };

    setItems([...items, newItem]);
    // Reset fields
    setQty(1);
    setLength(0);
    setWidth(0);
  };

  const removeItem = (idx: number) => {
    const newItems = [...items];
    newItems.splice(idx, 1);
    setItems(newItems);
  };

  const grandTotal = items.reduce((sum, item) => {
    const p = products.find(prod => prod.id === item.product_id);
    if (!p) return sum;
    return sum + calculateItemTotal(item, p);
  }, 0);

  const handleSubmit = async () => {
    if (items.length === 0) return;
    if (!customerName.trim()) {
      alert("Customer Name is mandatory.");
      return;
    }

    const fullAddress = [addrLine1, addrLine2, city].filter(Boolean).join(", ");

    try {
      await createInvoice({
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
      navigate("/");
    } catch (e) {
      console.error(e);
      alert("Error creating invoice");
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">

      {/* Left Column: Item Entry */}
      <div className="md:w-5/12 flex flex-col gap-6 h-full overflow-y-auto pr-2">
        {/* Customer Details Card */}
        <div className="card">
          <div className="mb-4 border-b border-slate-100 pb-2">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <User size={18} className="text-blue-600" /> Customer Details
            </h2>
          </div>
          <div className="space-y-3">
            {/* Date removed - computed internally */}
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
            <div className="grid grid-cols-2 gap-4">
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
            </div>
          </div>
        </div>

        {/* Product Selection Card */}
        <div className="card flex-1 flex flex-col justify-center">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Calculator size={20} className="text-blue-600" /> Add Item
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Select Product</label>
              <select
                className="input-field"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                <option value="">-- Choose Product --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_qty})</option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unit</label>
                    <select
                      className="input-field"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value as Unit)}
                    >
                      <option value={Unit.PIECE}>Piece</option>
                      <option value={Unit.SQFT}>Sq. Ft</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Qty</label>
                    <input
                      type="number" className="input-field"
                      value={qty} onChange={e => setQty(Number(e.target.value))}
                    />
                  </div>
                </div>

                {unit === Unit.SQFT && (
                  <div className="grid grid-cols-2 gap-4 animate-fade-in-down">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Length (ft)</label>
                      <input
                        type="number" className="input-field"
                        value={length} onChange={e => setLength(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Width (ft)</label>
                      <input
                        type="number" className="input-field"
                        value={width} onChange={e => setWidth(Number(e.target.value))}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 text-right">
                  <span className="text-sm text-slate-500 mr-2">Rate:</span>
                  <span className="font-mono font-medium">
                    {unit === Unit.SQFT ? `₹${selectedProduct.price_per_sqft}/sqft` : `₹${selectedProduct.price_per_piece}/pc`}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={addItem}
              disabled={!selectedProduct}
              className="w-full btn-primary disabled:bg-slate-300 disabled:shadow-none mt-4 py-3 flex justify-center gap-2"
            >
              <Plus size={18} /> Add to Invoice
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Invoice Summary */}
      <div className="md:w-7/12 flex flex-col h-full">
        <div className="card flex-1 flex flex-col p-0 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <ShoppingCart size={20} className="text-blue-600" /> Current Invoice
            </h2>
            <div className="text-sm text-slate-500">
              {items.length} Items
            </div>
          </div>

          <div className="px-6 py-2 bg-yellow-50 border-b border-yellow-100 flex flex-col gap-1 text-xs text-yellow-800">
            <div className="flex justify-between">
              <span>Customer: <strong>{customerName || 'Walk-in'}</strong></span>
              <span>Date: <strong>{new Date().toLocaleDateString()}</strong></span>
            </div>
            {customerGstin && <div>GSTIN: <strong>{customerGstin}</strong></div>}
          </div>

          <div className="flex-1 overflow-y-auto p-0">
            <table className="w-full">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="table-th pl-6">Item</th>
                  <th className="table-th text-center">Dimensions</th>
                  <th className="table-th text-right">Qty</th>
                  <th className="table-th text-right">Total</th>
                  <th className="table-th w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400">
                      No items added yet.
                    </td>
                  </tr>
                )}
                {items.map((item, idx) => {
                  const p = products.find(prod => prod.id === item.product_id);
                  if (!p) return null;
                  const total = calculateItemTotal(item, p);
                  return (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="table-td pl-6 font-medium text-slate-800">{p.name}</td>
                      <td className="table-td text-center text-xs text-slate-500">
                        {item.unit === Unit.SQFT
                          ? `${item.length_ft}' x ${item.width_ft}'`
                          : `-`}
                      </td>
                      <td className="table-td text-right">{item.quantity} {item.unit === Unit.SQFT ? 'pcs' : ''}</td>
                      <td className="table-td text-right font-mono">₹{total.toFixed(2)}</td>
                      <td className="table-td pr-6 text-right">
                        <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-medium text-slate-600">Grand Total</span>
              <span className="text-3xl font-bold text-slate-900 font-mono">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={items.length === 0}
              className="w-full bg-green-600 text-white py-3 rounded-lg shadow-lg shadow-green-600/20 hover:bg-green-700 disabled:shadow-none disabled:bg-slate-300 font-bold text-lg flex justify-center gap-2"
            >
              <Save size={20} /> Save & Generate Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
