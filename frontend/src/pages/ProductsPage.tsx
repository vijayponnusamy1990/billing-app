import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts, createProduct } from "../api/productsApi";
import { Product, Category, Unit, ProductCreate } from "../types";
import { Plus, Search, Filter } from "lucide-react";

import { useToast } from "../components/Toaster";

export default function ProductsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const LIMIT = 20;

  // Form State
  const [formData, setFormData] = useState<ProductCreate>({
    name: "",
    category: Category.PLYWOOD,
    base_unit: Unit.PIECE,
    alt_unit: undefined,
    stock_qty: 0,
    price_per_sqft: 0,
    price_per_piece: 0,
    thickness: "",
    dimension: "",
    gst_rate: 18,
    low_stock_limit: 5,
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts({ skip: (page - 1) * LIMIT, limit: LIMIT, q: searchQuery });
      setProducts(data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProduct(formData);
      setIsCreating(false);
      fetchProducts();
      toast.success("Product created successfully!");
      // Reset
      setFormData({
        name: "",
        category: Category.PLYWOOD,
        base_unit: Unit.PIECE,
        stock_qty: 0,
        price_per_sqft: 0,
        price_per_piece: 0,
        thickness: "",
        dimension: "",
        gst_rate: 18,
        low_stock_limit: 5,
      });
    } catch (e) {
      toast.error("Error creating product");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="sub-text mt-1">Manage your products and stock levels.</p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="btn btn-primary btn-md flex items-center gap-2"
        >
          {isCreating ? "Cancel" : <><Plus size={18} /> Add Product</>}
        </button>
      </div>

      {isCreating && (
        <div className="card animate-fade-in-down p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800">Add New Product</h2>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Product Name</label>
              <input
                className="input-field font-semibold"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Ex. 12mm Plywood"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Category</label>
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
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Stock Qty</label>
              <input
                type="number"
                className="input-field"
                value={formData.stock_qty}
                onChange={(e) => setFormData({ ...formData, stock_qty: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Thickness</label>
              <input
                className="input-field"
                value={formData.thickness}
                onChange={(e) => setFormData({ ...formData, thickness: e.target.value })}
                placeholder="Ex. 12mm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Dimension</label>
              <input
                className="input-field"
                value={formData.dimension}
                onChange={(e) => setFormData({ ...formData, dimension: e.target.value })}
                placeholder="Ex. 8x4"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Buying Price (₹)</label>
              <input
                type="number"
                className="input-field"
                value={formData.buying_price}
                onChange={(e) => setFormData({ ...formData, buying_price: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Selling Price (₹)</label>
              <input
                type="number"
                className="input-field font-bold text-slate-800"
                value={formData.price_per_piece}
                onChange={(e) => setFormData({ ...formData, price_per_piece: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">SqFt per Piece</label>
              <input
                type="number"
                className="input-field"
                value={formData.sqft_per_piece}
                onChange={(e) => setFormData({ ...formData, sqft_per_piece: Number(e.target.value) })}
                placeholder="Ex. 32"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">GST Rate (%)</label>
              <input
                type="number"
                className="input-field"
                value={formData.gst_rate}
                onChange={(e) => setFormData({ ...formData, gst_rate: Number(e.target.value) })}
              />
            </div>

            <div className="md:col-span-4 flex justify-end mt-2">
              <button type="submit" className="btn btn-primary w-full md:w-auto px-8">
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
            <input
              placeholder="Search products..."
              className="input-field pl-10"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <button className="btn btn-secondary btn-md flex items-center gap-2"><Filter size={18} /> Filter</button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading inventory...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th text-left pl-6">Product Name</th>
                  <th className="table-th text-left">Thickness/Dim</th>
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
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/products/${p.id}/edit`)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="table-td pl-6 font-medium text-slate-900">{p.name}</td>
                    <td className="table-td text-slate-500 text-xs">
                      {p.thickness || p.dimension ? `${p.thickness || ''} ${p.dimension || ''}` : '-'}
                    </td>
                    <td className="table-td">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {p.category}
                      </span>
                    </td>
                    <td className="table-td text-right font-mono">{p.stock_qty}</td>
                    <td className="table-td text-slate-500 text-xs">{p.base_unit}</td>
                    <td className="table-td text-right pr-6 font-mono font-medium text-slate-700">
                      ₹{p.price_per_piece}/pc
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center pt-4">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="btn btn-secondary btn-sm"
        >
          Previous
        </button>
        <span className="text-sm font-bold text-slate-500">Page {page}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={products.length < LIMIT}
          className="btn btn-secondary btn-sm"
        >
          Next
        </button>
      </div>
    </div>
  );
}
