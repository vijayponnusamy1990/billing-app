import { useEffect, useState } from "react";
import { getProducts, createProduct } from "../api/productsApi";
import { Product, Category, Unit, ProductCreate } from "../types";
import { Plus, Search, Filter } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [formData, setFormData] = useState<ProductCreate>({
    name: "",
    category: Category.PLYWOOD,
    base_unit: Unit.PIECE,
    alt_unit: undefined,
    stock_qty: 0,
    price_per_sqft: 0,
    price_per_piece: 0,
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProduct(formData);
      setIsCreating(false);
      fetchProducts();
      // Reset
      setFormData({
        name: "",
        category: Category.PLYWOOD,
        base_unit: Unit.PIECE,
        stock_qty: 0,
        price_per_sqft: 0,
        price_per_piece: 0,
      });
    } catch (e) {
      alert("Error creating product");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory</h1>
          <p className="text-slate-500">Manage your products and stock levels.</p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="btn-primary flex items-center gap-2"
        >
          {isCreating ? "Cancel" : <><Plus size={18} /> Add Product</>}
        </button>
      </div>

      {isCreating && (
        <div className="card animate-fade-in-down">
          <h2 className="text-lg font-semibold mb-4 text-slate-800">Add New Product</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
              <input
                className="input-field"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Ex. 12mm Plywood"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                className="input-field"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
              >
                {Object.values(Category).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
              <select
                className="input-field"
                value={formData.base_unit}
                onChange={(e) => setFormData({ ...formData, base_unit: e.target.value as Unit })}
              >
                {Object.values(Unit).map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current Stock</label>
              <input
                type="number"
                className="input-field"
                value={formData.stock_qty}
                onChange={(e) => setFormData({ ...formData, stock_qty: Number(e.target.value) })}
              />
            </div>

            <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Price / SqFt (₹)</label>
                <input
                  type="number"
                  className="input-field"
                  value={formData.price_per_sqft}
                  onChange={(e) => setFormData({ ...formData, price_per_sqft: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Price / Piece (₹)</label>
                <input
                  type="number"
                  className="input-field"
                  value={formData.price_per_piece}
                  onChange={(e) => setFormData({ ...formData, price_per_piece: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="md:col-span-3 flex justify-end">
              <button type="submit" className="btn-primary">
                Save Product
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <div className="p-4 border-b border-slate-100 flex gap-4 items-center bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input placeholder="Search products..." className="input-field pl-10" />
          </div>
          <button className="btn-secondary flex items-center gap-2"><Filter size={18} /> Filter</button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading inventory...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th text-left pl-6">Product Name</th>
                  <th className="table-th text-left">Category</th>
                  <th className="table-th text-right">Stock</th>
                  <th className="table-th text-left">Unit</th>
                  <th className="table-th text-right pr-6">Price</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-slate-500">No products found. Add some!</td></tr>
                )}
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-td pl-6 font-medium text-slate-900">{p.name}</td>
                    <td className="table-td">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {p.category}
                      </span>
                    </td>
                    <td className="table-td text-right font-mono">{p.stock_qty}</td>
                    <td className="table-td text-slate-500 text-xs">{p.base_unit}</td>
                    <td className="table-td text-right pr-6 font-mono font-medium text-slate-700">
                      {p.price_per_sqft ? `₹${p.price_per_sqft}/sqft` : `₹${p.price_per_piece}/pc`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
